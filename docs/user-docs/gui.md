# GUI: Graphical User Interface

## GUI overview

Below, a picture of the complete GUI on macOS.

<figure>
<img src="../../assets/images/gui.png" alt="The GUI of gitinspectorgui on macOS.">
<figcaption>The GUI of gitinspectorgui on macOS.</figcaption>
</figure>

The two main parts of the GUI are:

1.  The input part where the options are defined. This part can be scrolled up and down using the top scroll bar at the right.
2.  The console output part, where progress output is presented to the user while the repositories are analyzed. The console has its own scrollbar.

## General guidelines

There are eight input fields in the GUI where space separated patterns can be entered:

-   Input folder path
-   Include files: File patterns
-   Extensions: File extensions to include
-   Five input fields for exclusion patterns

### Multiple patterns

Multiple patterns can be entered in the input fields by separating them with commas. For example, to include files with the extensions `java` and `py`, the pattern should be entered as `java, py`.

### Asterisk `*`

The asterisk `*` is a wildcard character that matches zero or more characters, just like in the shell. For example, to exclude all files with the extension `.py`, the pattern should be entered as `*.py`.

### Case insensitivity

Matches are case insensitive, e.g. `mary` matches `Mary` and `mary`, and `John` matches `john` and `John`.

## Top row buttons

Run
Start the analysis, using the parameters given in the GUI.

Clear
Clear the console, the textual output box at the bottom.

Help
Prints a few lines op help output in the console.

About
Opens a dialog with information about the application.

Exit
Leave the GUI.

Percentage box
The percentage box at the far right has small up and down triangles to increase or decrease the maximum percentage of the height of the total GUI window that is taken up by the input part. The console takes up the remaining percentage.

When the height of the GUI window is changed by dragging the top or bottom edges of the window, the height of the input part is kept unchanged while dragging. When the window height has become stable after dragging, the height of the input part is adjusted to the percentage value.

## IO configuration

Input folder path
Enter one or more comma separated folder paths in the text box, or select one using the `Browse` button. The paths are searched for repositories.

### Input folder path is a repository

<figure>
<img src="../../assets/images/gui-repo-select.png" alt="Repository selection in the GUI">
</figure>

If the input folder path is a repository, that repository is analyzed and no search for additional repositories takes place.

Output file path
The output file path depends on the selected output prepostfix (see next option). In the example figure, the input folder path is the path of the repository `1dh`. Depending on the selected pre or postfix, the output file path is:

-   `Postfix with repo`: `/Users/.../1-repos/grading/1dh-gitinspect`.
-   `Prefix with repo`: `/Users/.../1-repos/grading/gitinspect-1dh`.
-   `No prefix or postfix`: `/Users/.../1-repos/grading/gitinspect`.

Output prepostfix
Select one of `Postfix with repo`, `Prefix with repo`, `No prefix or postfix` (default).

Note that the output file is not placed inside of the repository, but in its parent folder.

Search depth
Disabled and ignored in this case.

Output file base
The output filename without extension and without directories, default `gitinspect`.

Subfolder
Restrict analysis of the files of the repository to the files in this folder and its subfolders. Remove the subfolder from the path of the files in the output.

N files
Generate output for the `N` biggest files for each repository. The number of files for which results are generated can be smaller than `N` due to files being excluded by filters. Leave the field empty or set it to zero to show all files. Default is 5.

File patterns
Show only files matching any of the space separated patterns. When the pattern is empty, the N largest files specified by option N files are shown.

### Input folder path is a folder but not a repository

<figure>
<img src="../../assets/images/gui-folder-select.png" alt="Folder selection in the GUI">
</figure>

If the input folder path is not a repository, all folder and subfolders up to the value of the `Search depth` option are searched for repositories and the repositories found are analyzed. The output file for each repository found is placed in the parent directory of the repository.

Output file base
For each repository found, the output file base is as specified for the case `input-is-repo`.

Output file path
For each repository found, the output file path is as specified for the case `input-is-repo`.

Output prepostfix
For the values `Postfix with repo` and `Prefix with repo`, the output file path for each repository found is as specified for the case `input-is-repo`. The value `No prefix or postfix` is disabled in this case.

Search depth
Positive integer value that represents the number of levels of subfolders that is searched for repositories, _default_ `5`.

-   Search depth `0`: the input folder itself must be a repository.
-   Search depth `1`: only the input folder is searched for repository folders for analysis.

The remaining options are as specified for the case `input-is-repo`.

## Output generation and formatting

### View options

Auto
Automatically open a viewer on the analysis results. The viewer is opened after the analysis is finished.

Dynamic blame history
Automatically open a viewer on the dynamic blame history. The viewer is opened after the analysis is finished.

### Output formats

Tick boxes `auto` and `dynamic blame history` define whether a viewer is opened on the analysis results. The tick boxes on the line `File formats` define for which file formats output is generated. Available output formats are `html` and `excel`. For more information on the output formats, see `output`.

### Statistic output

These options define the columns that are shown in the output of the four first tables: Authors, Authors-Files, Files-Authors and Files.

Show renames
Show previous file names and alternative author names and emails in the output.

Some authors use multiple names and emails in various commits. Gitinspectorgui can detect this if there is overlap in either the name or email in author-email combinations in commits. If show-renames is active, all names and emails of each author are shown. If inactive, only a single name and email are shown per author.

For files that have been renamed at some point in their history, all previous names are shown in the output.

Deletions
Include a column for the number of deleted lines in the output. This does not affect the blame output, because deleted lines cannot be shown. The default is not to include deletions.

Scaled %
For each column with output in percentages, e.g. `% Insertions`, add a column `% Scaled insertions`, which equals the value of `% Insertions` multiplied by the number of authors in the repository.

### Blame options

!!! note

    A blame worksheet or html blame tab shows the contents of a file and indicates for each line in the file in which commit the line was last changed, at which date and by which author. The color of the line indicates the author of the last change. The blame output is generated for each file that is analyzed.

Exclusions
By means of this option, excluded blame lines can be hidden, shown or removed from the blame output. Blame lines can be excluded for three reasons:

1.  The author of the blame line is excluded by the `Author` `Exclusion pattern`.
2.  The blame line is a comment line. By default, comment lines are excluded. They can be included by the option `Comments`.
3.  The blame line is an empty line. By default, empty lines are excluded. They can be included by the option `Empty lines`.

Values of the `Exclusions` option are:

-   `hide` (default). Excluded lines are shown in the blame sheets as white, uncolored lines.
-   `show`. Excluded lines are attributed to their author as blame lines in the color of the author.
-   `remove`. Excluded lines are removed from the blame lines.

Copy move
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

Blame skip
Do not output html blame tabs or Excel blame sheets.

### Blame inclusions

Empty lines
Include empty lines in the blame calculations. This affects the color of the empty lines in the blame sheets. The default is not to include them and show all empty lines in the blame sheets as white. When this setting is active, empty lines are shown in the color of their author.

<div id="gui-comments">

Comments
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

Whitespace
Include whitespace changes in the statistics. This affects the statics and the blame output. The default setting is to ignore whitespace changes.

Multithread
Use multiple threads to analyze the repositories. The default is to use a single thread.

Since
Enter a date in the text box in the format YYYY-MM-DD, where leading zeros are optional for month and day, or select one using the `.` button. Only show statistics for commits more recent than the given date.

Until
Only show statistics for commits older than the given date. See Since for the date format.

Verbosity

-   0 (default): Show a dot for each file that is analyzed for each repository.
-   1: Show the file name instead of a dot for each analyzed file.
-   2: Show maximum debug output in the console.

Dry run

-   0: Normal analysis and output (default).
-   1: Perform all required analysis and show the output in the console, but do not write any output files and do not open any viewers.
-   2: Do not perform any analysis and do not produce any file or viewer output, but do print output lines to the console.

Extensions
A comma separated list of file extensions to include when computing statistics. The default extensions used are: c, cc, cif, cpp, glsl, h, hh, hpp, java, js, py, rb, sql.

Specifying an asterisk `*` includes all files, regardless of extension, including files without an extension. For more information, see the `supported`.

## Settings

Save
Save all settings specified in the GUI to the currently active settings file and print this file name to the console, see the above figure.

Save As
Save the settings specified in the GUI to another file. This file becomes the currently active settings file.

Load
Open a browse dialog to select a settings file to load. This file becomes the currently active settings file.

Reset
Reset all settings to their default values and reset the location of the currently active settings file to its default, operating system dependent, location.

Toggle
Toggle the representation of the settings file between the name and the full path.

## Exclusion patterns

Exclusion patterns are used to filter out certain elements from the analysis results. Each exlusion pattern is a comma separated list of strings. Note that this is different from the CLI, where the exclusion patterns are space separated.

The asterisk `*` is a wildcard character that matches zero or more characters, just like in the shell. Exclusion patterns are used in the following fields:

Authors
Filter out author names that match any of the comma separated strings in the text box. E.g. `John Smith` excludes author `John Smith` and `John, Smith` excludes author `John` and author `Smith`, but not author `John Fielding`. To exclude all authors with the first name John, use `John*`.

Emails
Filter out email addresses taht match any of the space separated strings in the text box. E.g. `*@gmail.com` excludes all authors with a gmail address.

Files/Paths
Filter out files that match containing any of the space separated strings in the text box. E.g. `myfile.py test*` excludes files `myfile.py` and `testing.c`.

Revision hashes
Filter out revisions that start with any of the space separated hashes/SHAs in the text box. E.g. `8755fb, 1234567` excludes revisions that start with `8755fb` or `1234567`.

Commit messages
Filter out commit messages that match any of the space separated strings in the text box. E.g. `bug*, fix*` excludes commits from analysis with commit messages such as `Bugfix` or `Fixing issue #15`.
