import json
import sys
import logging
from pathlib import Path
from typing import Any, Dict, List

# --- Setup Python Path ---
# This is a placeholder. In a real scenario, you'd ensure that the gigui modules
# are installable or correctly added to sys.path.
# For development, you might add the path to the old source.
OLD_SRC_PATH = Path(__file__).resolve().parent.parent.parent / "gitinspectorgui-old" / "src"
if OLD_SRC_PATH.exists() and str(OLD_SRC_PATH) not in sys.path:
    sys.path.insert(0, str(OLD_SRC_PATH))
# --- End Setup Python Path ---

try:
    from gigui.args_settings import Args
    from gigui.data import IniRepo
    from gigui.repo_runner import RepoRunner
    from gigui.runner_queues import RunnerQueues # For dummy queues
    from gigui import shared as gigui_shared # To set shared.cli if necessary
except ImportError as e:
    # Fallback for local development if modules were copied directly
    # This assumes api.py is in python/ and gigui modules are in python/gigui/
    # Adjust as necessary based on your project structure.
    try:
        # This assumes api.py is in python/ and gigui modules are in python/gigui/
        # If you copied the 'gigui' folder from 'gitinspectorgui-old/src/'
        # into 'gitinspectorgui/python/', then this structure might work.
        # You might need to adjust internal imports within the copied gigui modules.
        sys.path.insert(0, str(Path(__file__).resolve().parent)) # Add 'python' dir to path
        from gigui.args_settings import Args
        from gigui.data import IniRepo
        from gigui.repo_runner import RepoRunner
        from gigui.runner_queues import RunnerQueues
        from gigui import shared as gigui_shared
    except ImportError:
        print(json.dumps({"error": f"Failed to import gigui modules: {e}. Check PYTHONPATH or script location."}), file=sys.stderr)
        sys.exit(1)


logging.basicConfig(level=logging.WARNING, format='%(asctime)s - %(levelname)s - %(name)s - %(message)s')
logger = logging.getLogger(__name__)

def create_args_from_dict(settings_dict: Dict[str, Any]) -> Args:
    """
    Creates an Args object from a dictionary of settings.
    """
    args = Args()
    for key, value in settings_dict.items():
        if hasattr(args, key):
            # Special handling for n_files, which might be "" in JSON but needs to be int
            if key == "n_files" and isinstance(value, str):
                try:
                    args.n_files = int(value) if value else 0 # Or some default like Args.DEFAULT_N_FILES
                except ValueError:
                    args.n_files = 0 # Or default
            else:
                setattr(args, key, value)
        else:
            logger.warning(f"Unknown setting '{key}' in input JSON, ignoring.")

    # Ensure input_fstrs is a list
    if not isinstance(args.input_fstrs, list):
        args.input_fstrs = []
        logger.warning("'input_fstrs' was not a list or was missing, defaulting to empty list.")

    # Default file_formats if not provided, as RepoRunner might expect it
    if not args.file_formats:
        args.file_formats = [] # No file generation, we want raw data

    return args

def process_repository(repo_path_str: str, args: Args) -> Dict[str, Any]:
    """
    Processes a single repository and returns its analysis data.
    """
    repo_path = Path(repo_path_str)
    if not repo_path.exists() or not repo_path.is_dir():
        return {"error": f"Repository path not found or not a directory: {repo_path_str}"}

    # gigui modules might rely on shared.cli
    # gigui_shared.cli = True # Set if logic within gigui depends on this flag

    try:
        ini_repo = IniRepo(location=str(repo_path.resolve()), args=args, name=repo_path.name)
        
        # RepoRunner expects queues, even if we don't use them for multicore processing here.
        # For a synchronous API call, multicore is false.
        queues = RunnerQueues(multicore=False) 
        repo_runner = RepoRunner(ini_repo=ini_repo, queues=queues)

        logger.info(f"Starting analysis for repository: {repo_path_str}")
        analysis_success = repo_runner.run_analysis()

        if not analysis_success:
            logger.warning(f"No statistics found or analysis failed for {repo_path_str}")
            return {"repo_path": repo_path_str, "status": "no_stats_found_or_failed", "data": {}}

        repo_data: Dict[str, Any] = {
            "repo_name": repo_runner.name,
            "repo_path": str(repo_runner.path),
        }

        # Extract statistical data
        stats_data: Dict[str, List[Dict[str, Any]]] = {}

        # Authors Stats
        auth_headers = repo_runner.header_authors(html=False) # Get non-HTML specific headers
        auth_rows = repo_runner.get_author_rows(html=False)
        stats_data["authors_stats"] = [dict(zip(auth_headers, row)) for row in auth_rows]

        # Authors-Files Stats
        auth_files_headers = repo_runner.header_authors_files(html=False)
        auth_files_rows = repo_runner.get_authors_files_rows(html=False)
        stats_data["authors_files_stats"] = [dict(zip(auth_files_headers, row)) for row in auth_files_rows]
        
        # Files-Authors Stats
        files_auth_headers = repo_runner.header_files_authors(html=False)
        files_auth_rows = repo_runner.get_files_authors_rows(html=False)
        stats_data["files_authors_stats"] = [dict(zip(files_auth_headers, row)) for row in files_auth_rows]

        # Files Stats
        files_headers = repo_runner.header_files() # html flag not present
        files_rows = repo_runner.get_files_rows()
        stats_data["files_stats"] = [dict(zip(files_headers, row)) for row in files_rows]
        
        repo_data["statistics"] = stats_data

        # Extract Blame Data
        if not args.blame_skip:
            blame_data_by_file: Dict[str, List[Dict[str, Any]]] = {}
            blame_headers = repo_runner.header_blames(args)
            
            # Ensure fstr2blames is populated and accessible
            # The actual list of files with blame might be repo_runner.fstrs or keys of repo_runner.fstr2blames
            files_for_blame = []
            if hasattr(repo_runner, 'fstr2blames') and repo_runner.fstr2blames:
                 files_for_blame = list(repo_runner.fstr2blames.keys())
            elif hasattr(repo_runner, 'fstrs') and repo_runner.fstrs: # Fallback if fstr2blames isn't directly available/populated early
                 files_for_blame = repo_runner.fstrs

            if not files_for_blame:
                logger.warning(f"No files found for blame processing in {repo_path_str}. 'fstr2blames' or 'fstrs' might be empty.")

            for fstr in files_for_blame:
                blame_rows, _ = repo_runner.get_fstr_blame_rows(fstr)
                if blame_rows:
                    blame_data_by_file[fstr] = [dict(zip(blame_headers, row)) for row in blame_rows]
            repo_data["blame_data"] = blame_data_by_file
        else:
            repo_data["blame_data"] = "skipped"

        logger.info(f"Successfully processed repository: {repo_path_str}")
        return {"repo_path": repo_path_str, "status": "success", "data": repo_data}

    except Exception as e:
        logger.error(f"Error processing repository {repo_path_str}: {e}", exc_info=True)
        return {"repo_path": repo_path_str, "status": "error", "error_message": str(e)}

def main():
    # Read settings JSON from stdin
    try:
        input_json_str = sys.stdin.read()
        if not input_json_str:
            print(json.dumps({"error": "No input JSON received from stdin."}), file=sys.stderr)
            sys.exit(1)
        settings_dict = json.loads(input_json_str)
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON input: {e}"}), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"Error reading from stdin: {e}"}), file=sys.stderr)
        sys.exit(1)

    args = create_args_from_dict(settings_dict)
    
    if not args.input_fstrs:
        print(json.dumps({"error": "No input repository paths ('input_fstrs') provided in settings."}), file=sys.stderr)
        sys.exit(1)

    all_results = []
    for repo_path_str in args.input_fstrs:
        result = process_repository(repo_path_str, args)
        all_results.append(result)

    # Output the aggregated results as JSON to stdout
    try:
        output_json = json.dumps(all_results, indent=4)
        print(output_json)
    except TypeError as e:
        # Fallback if complex objects are not serializable (should not happen with current structure)
        print(json.dumps({"error": f"Failed to serialize results to JSON: {e}", "results_preview": str(all_results)[:500]}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
