# CLI: Command Line Interface

## Synopsis

```text
gitinspectorgui
  [-h] [-r [PATH ...] | -g | -V | --about] [-i PATH [PATH ...]]
  [-d DEPTH] [--subfolder SUBFOLDER] [-n [N]] [-f [PATTERNS ...]]
  [-o FILE_BASE] [--fix {prefix,postfix,nofix}]
  [--view {auto,dynamic-blame-history,none}]
  [-F [{html,excel} ...]] [--show-renames | --no-show-renames]
  [--deletions | --no-deletions]
  [--scaled-percentages | --no-scaled-percentages]
  [--blame-exclusions {hide,show,remove}] [--copy-move N]
  [--blame-skip | --no-blame-skip]
  [--empty-lines | --no-empty-lines] [--comments | --no-comments]
  [--whitespace | --no-whitespace] [--since SINCE] [--until UNTIL]
  [-v {0,1,2}] [--dryrun {0,1,2}] [-e [EXTENSIONS ...]]
  [--multithread | --no-multithread] [--multicore | --no-multicore]
  [--reset-file | --load PATH] [--reset] [--save] [--save-as PATH]
  [--show] [--ex-files [PATTERNS ...]]
  [--ex-authors [PATTERNS ...]] [--ex-emails [PATTERNS ...]]
  [--ex-revisions [PATTERNS ...]] [--ex-messages [PATTERNS ...]]
  [--profile N]
```

## Overview

The command line interface (CLI) can be used to start the GUI or to analyze repositories directly from the command line. GUI and CLI share the same settings file. They start by loading the settings from the settings file.

`-h` `--help`
Display help and exit. This has priority over the other settings.

## General guidelines

There are eight options where space separated patterns can be entered:

- `PATH ...`: Path patterns to input repositories or folders
- `--include-files PATTERNS`: File patterns to include
- `--extensions EXTENSIONS`: File extensions to include
- `--ex-... PATTERNS`: Five input fields for exclusion patterns

### Multiple patterns

Multiple patterns can be entered in the input fields by separating them with spaces. For example, to include files with the extensions `java` and `py`, the pattern can be entered as `-e java py`. Multiple patterns can also be specified by repeating the option, e.g. `-e java -e py`.

### Quotes `""` or `''`

In the input fields, quotes are needed to include spaces in a pattern. For example, to exclude the authors John Smith and Mary in the Author exclusion input field, the pattern should be entered as `"John Smith" Mary`.

### Asterisk `*`

The asterisk `*` is a wildcard character that matches zero or more characters. To avoid interpretation of the asterisk as a wildcard by the shell, the asterisk or the entire input pattern can be enclosed in quotes.

### Case insensitivity

Matches are case insensitive, e.g. `mary` matches `Mary` and `mary`, and `John` matches `john` and `John`.

### Abbreviations

Option names can be abbreviated as long as the abbreviation is unique and unambiguous. For example, the option `--ex-authors` can be abbreviated as `--ex-a` or `--ex-au`, as there is no other option that starts with `--ex-a`.

## Mutually exclusive options

`-r [PATH ...]`, `--run [PATH ...]`
Analyze the repositories in the specified paths and generate output files. The output file for each repository is placed in the parent directory of the repository. When no path is specified, the path is taken from the settings.

`-g`, `--gui`
Start the GUI with settings loaded from the settings file.

`-V` `--version`
Output version information and exit.

`--about`
Output information about the program and exit.

## Input

`-i PATH ...`, `--input PATH ...`
Set the input path according to the value of `PATH ...`. This option can be combined with option `-r` only when `-r` has no arguments. Another useful combination is with the `--save` to save the input path to the settings file.

IF `PATH` is a repository, that repository is analyzed and no search for additional repositories takes place.

If `PATH` is a folder, but not a repository, all folder and subfolders up to the value of the `--depth` option are searched for repositories and the repositories found are analyzed. The output file for each repository is placed in the parent directory of the repository.

`-d N` `--depth N`
Integer value bigger or equal to zero, that represents the number of levels of subfolders that is searched for repositories, _default_ `5`.

- `-d 0`: the input folder itself must be a repository.
- `-d 1`: only the input folder is searched for repository folders for analysis.

`--subfolder SUBFOLDER`
Restrict analysis of the files of the repository to the files in this folder and its subfolders. Remove the subfolder from the path of the files in the output.

`-n N` `--n-files N`
Generate output for the `N` biggest files for each repository. The number of files for which results are generated can be smaller than `N` due to files being excluded by filters. Leave the field empty or set it to zero to show all files. Default is 5.

`-f PATTERNS`, `--include-files PATTERNS`
Show only files matching any of the space separated patterns. When the pattern is empty (`-f ""`), the `N` largest files specified by option `-n N` files are shown.

## Output

`-o FILEBASE` `--output FILEBASE`
The output filename, without extension and without parents is `FILEBASE`. Default: `gitinspect`.

`--fix {prefix,postfix,nofix}`

> - `-f prefix` output file name is `REPONAME-FILEBASE`.
> - `-f postfix` output file name is `FILEBASE-REPONAME`.
> - `-f nofix` output file name is `FILEBASE`.

## Output generation and viewing

`--auto, --no-auto`
Open a viewer is opened on the analysis results.

<div id="output-formats-cli">

`-F FORMAT` `--file-format FORMAT`
Selects for which file formats output is generated. Available choices are `html` and `excel`. To select more than one output format separate them by spacing or repeat the option, e.g. `-F html excel` or `-F html -F excel`. For more information on the output formats, see `output`.

</div>

## Statistics output

`--show-renames, --no-show-renames`
Show previous file names and alternative author names and emails in the output.

Some authors use multiple names and emails in various commits. Gitinspectorgui can detect this if there is overlap in either the name or email in author-email combinations in commits. If show-renames is active, all names and emails of each author are shown. If inactive, only a single name and email are shown per author.

For files that have been renamed at some point in their history, all previous names are shown in the output.

`--deletions, --no-deletions`
Include a column for the number of deleted lines in the output. This does not affect the blame output, because deleted lines cannot be shown. The default is not to include deletions.

`--scaled-percentages, --no-scaled-percentages`
For each column with output in percentages, e.g. `Insertions %`, add a column `Scaled insertions %`, which equals the value of `Insertions %` multiplied by the number of authors in the repository.

## Blame options

!!! note

    A blame worksheet or html blame tab shows the contents of a file and indicates for each line in the file in which commit the line was last changed, at which date and by which author. The color of the line indicates the author of the last change. The blame output is generated for each file that is analyzed.

`--blame-omit-exclusions, --no-blame-omit-exclusions`
By means of this option, excluded blame lines can be hidden or shown or removed from the blame output. Blame lines can be excluded for three reasons:

1.  The author of the blame line is excluded by the `--ex-author PATTERNS` exclusion pattern.
2.  The blame line is a comment line. By default, comment lines are excluded. They can be included by the option `--comments`.
3.  The blame line is an empty line. By default, empty lines are excluded. They can be included by the option `--empty-lines`.

Excluded lines are not attributed to their author as blame lines. They are shown in the blame sheets as white, uncolored lines. When the option `--blame-omit-exclusions` is active, the blame sheets omit the excluded lines from the blame output.

`--copy-move N`
This option, with values from 0 to 4, affects only the Excel blame worksheets:

0.  Do not detect moved or copied lines. This means that the author that moves or copies a set of lines becomes the new author of the lines.
1.  Detect moved or copied lines within a file. This means that the (original) author of the lines that are moved or copied remains the author of the lines, independently of whoever copies or moves the lines. This is the default.
2.  Follow moved or copied lines across files. Consider as potential origin of a set of lines only files that were changed in the same commit.
3.  Same as 2, but in addition, consider as potential origin of a set of lines also the files of the commit that created the file containing the set of lines.
4.  Same as 3, but consider as potential origin of a set of lines also the files of all other commits. This can be a very expensive operation for large projects.

!!! warning

    The value of 4 for the `--copy-move` option can be extremely slow for large repositories. The values 2 and 3 can also be slow for large repositories with many commits. The default value 1 is usually fast.

For more information, see [git blame](https://www.mankier.com/1/git-blame#-M). The option corresponds to the `-M` and `-C` options of the `git blame` command:

0.  No `-M` or `-C` options.
1.  `-M` option.
2.  `-C` option.
3.  `-C -C` options.
4.  `-C -C -C` options.

A file is considered to be a renamed or copied version of another file if they share 50% or more lines.

The `--copy-move` option does not affect the value of insertions and deletions in the statistics worksheets `Authors`, `Authors-Files`, `Files-Authors` and `Files`.

The problem is that even though `git log --follow`, which is used by gitinspectorgui to calculate insertions and deletions, does detect file rename and copy operations, it does not detect moved or copied lines. Insertions and deletions are always attributed to the author who does the change, even if the lines are moved or copied from another file.

`--blame-skip, --no-blame-skip`
Do not output html blame tabs or Excel blame sheets.

## Blame inclusions

The options `--empty-lines`, `--comments` and `--blame-omit-exclusions` affect the blame output. The options `--empty-lines` and `--comments` are used to include empty lines and comment lines in the blame output. The option `--blame-omit-exclusions` is used to hide or show or remove excluded blame lines from the blame output.

`--empty-lines, --no-empty-lines`
Include empty lines in the blame calculations. This affects the color of the empty lines in the blame sheets. The default is not to include them (`--no-empty-lines`) and show all empty lines in the blame sheets as white. When this setting is active, empty lines are shown in the color of their author.

<div id="cli-comments">

`--comments, --no-comments`
Include whole line comments in the blame calculations. This affects the number of lines of each author.

The default is not to include whole line comments, which means that such lines are not attributed to any author and are shown in the blame sheets as white. Whole line comments are not counted in the Lines column of the statistics output, potentially causing the sum of the Lines column to be less than the total number of lines in the file.

When this setting is active, whole line comments are shown in the color as of their author and are counted in the Lines column of the statistics output.

A comment line is either a single or multi comment line. Only full line comments are considered comment lines. For instance, for Python, the following line is comment line:

```python
# Start of variable declarations
```

whereas the following line is not a comment line:

```python
x = 1  # Initialize x
```

`--empty-lines, --no-empty-lines`
Include empty lines in the blame calculations. This affects the color of the empty lines in the blame sheets. The default is not to include them (`--no-empty-lines`) and show all empty lines in the blame sheets as white. When this setting is active, empty lines are shown in the color of their author.

`--comments, --no-comments`
Include whole line comments in the blame calculations. This affects the number of lines of each author.

The default is not to include whole line comments, which means that such lines are not attributed to any author and are shown in the blame sheets as white. Whole line comments are not counted in the Lines column of the statistics output, potentially causing the sum of the Lines column to be less than the total number of lines in the file.

When this setting is active, whole line comments are shown in the color as of their author and are counted in the Lines column of the statistics output.

A comment line is either a single or multi comment line. Only full line comments are considered comment lines. For instance, for Python, the following line is comment line:

```python
# Start of variable declarations
```

whereas the following line is not a comment line:

```python
x = 1  # Initialize x
```

</div>

## General options

`--whitespace, --no-whitespace`
Include whitespace changes in the statistics. This affects the statics and the blame output. The default setting is to ignore whitespace changes.

`--since DATE`
Only show statistics for commits more recent than a specific date. The `DATE` format is YYYY-MM-DD, where leading zeros are optional for month and day, e.g. `--since 2022-1-31` or `--since 2022-01-31`.

`--until DATE`
Only show statistics for commits older than a specific date. See `--since` for the format of `DATE`.

`-v {0,1,2}`, `--verbosity {0,1,2}`
More verbose output for each `v`: `-v`, `-vv` or `-vvv`<span class="title-ref">. The maximum value 3 of the verbosity option in the GUI corresponds to </span><span class="title-ref">-vvv</span>\` in the CLI.

- 0 (default): Show a dot for each file that is analyzed for each repository.
- 1: Show the file name instead of a dot for each analyzed file.
- 2: Show maximum debug output in the console.

`--dry-run {0,1,2}`

- 0: Normal analysis and output (default).
- 1: Perform all required analysis and show the output in the console, but do not write any output files and do not open any viewers.
- 2: Do not perform any analysis and do not produce any file or viewer output, but do print output lines to the console.

`-e EXTENSIONS`, `--extensions EXTENSIONS`
A comma separated list of file extensions to include when computing statistics. The default extensions used are: `c, cc, cif, cpp, glsl, h, hh, hpp, java, js, py, rb, sql`.

Specifying an asterisk `*` includes all files, regardless of extension, including files without an extension. For more information, see the `supported`.

## Multithread and multicore

> `--multithread, --no-multithread`
> Analyse multiple files for changes and blames per repository using multiple threads.
>
> `--multicore, --no-multicore`
> Execute multiple repositories using multiple cores.

## Settings

`--show`
Output the location of the settings file and its values, then exit.

`--save`
Save the current settings to the settings file.

`--save-as PATH`
Save the current settings to the specified file. This file becomes the currently active settings file.

`--load PATH`
Load settings from the specified file. This file becomes the currently active settings file.

`--reset`
Reset all settings to their default values and reset the location of the currently active settings file to its default, operating system dependent, location.

## Exclusion patterns

Specify space separated exclusion patterns `PATTERNS`, describing file paths, author names or emails, revisions or commit messages that should be excluded from the statistics.

`--ex-authors PATTERNS`, `--exclude-authors PATTERNS`
Filter out author names containing any of the comma separated strings in `PATTERNS`. E.g. `"John Smith"` excludes author `John Smith` and `John Smith` excludes author `John` and author `Smith`. The quotes are needed to include spaces in a pattern.

`--ex-emails PATTERNS`, `--exclude-emails PATTERNS`
Filter out email addresses containing any of the comma separated strings in `PATTERNS`. E.g. `--ex-email "*@gmail.com"` excludes all authors with a gmail address. The quotes are needed to avoid interpretation of the asterisk as a wildcard by the shell.

`--ex-files PATTERNS`, `--exclude-files PATTERNS`
Filter out files (or paths) containing any of the comma separated strings in `PATTERNS`. E.g. `--ex-file myfile.py "test*"` excludes files `myfile.py` and `testing.c`. The quotes are needed to avoid interpretation of the asterisk as a wildcard by the shell.

`--ex-revisions PATTERNS`, `--exclude-revisions PATTERNS`
Filter out revisions that start with any of the space separated hashes/SHAs in the text box. E.g. `--ex-revisions 8755fb 1234567` excludes revisions that start with `8755fb` or `1234567`.

`--ex-messages PATTERNS`, `--exclude-messages PATTERNS`
Filter out commit messages containing any of the comma separated strings in `PATTERNS`. E.g. `--ex-message "bug*" fix` excludes commits from analysis with commit messages such as `Bugfix` or `Fixing issue #15`.

## Logging

`--profile N`
Output `N` lines of profiling output. Default 0.
