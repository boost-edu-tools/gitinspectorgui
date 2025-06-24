# Output

Multiple output formats can be selected, resulting in a separate output file for every selected format. See the [GUI documentation](gui.md#output-formats-and-viewer-options) or [CLI documentation](cli.md#output-formats-and-viewer-options) for information on this option.

## Output formats and viewer options

### File output formats

`html` and `excel`
Output is generated in the form of tables and saved in a file per repository.

`html` output is the default and most user-friendly output format, that can be displayed in the system's web browser. For multiple repositories, each repository is shown in a separate tab.

`Excel` tables are similar to `html` tables, but have more options. Each column header in an excel table has a triangle button which activates a dropdown menu for sorting and filtering. For single repositories, the output is opened in Excel for viewing.

### View option `auto`

-   In the case of file output, the output file is opened in the default viewer for the file type.
-   If no file output format is selected, the output is shown in the system web browser. The address is of the form `localhost:8080/?v=reponame-2d0c4e242077`, where `reponame` is the name of the repository and `2d0c4e242077` is a random unique 12-character string. When the user no longer needs the generated page(s), the page(s) should be closed, or the web browser can be closed, so that the server can be stopped and gitinspectorgui is ready for analysis of another repository.

### View option `dynamic blame history`

This option is allowed only when no file output formats are selected. The output pages that are displayed in the system web browser are similar to the pages generated for view option `auto` with no file output. The only difference is that additional blame information tables can be generated on the fly and displayed for each relevant commit in the repository. These commits are shown in the top line of the blame pages. The user can select a commit from the list to see the file as it was at that commit with the lines colored according to the author of the last change to that line.

## Output tables

For html and excel, output is generated in tables. Html tables are show in a browser window.

There are two kinds of tables: numerical analysis tables and blame tables. The format of the tables is described in more detail in the next sections.

Numerical analysis tables
Shown in four tables, each table in a separate tab (html) or worksheet: `Authors`, `Authors-Files` `Files-Authors` and `Files`. The worksheet `Authors` combines the results of all files, the worksheets `Authors-Files` and `Files-Authors` show results per author and per file, and the worksheet `Files` combines the results of all authors. The tables show among others the total number of insertions per author, per file, or per author-file combination. Also shown is the number of lines per author in the final version of each file.

Blame tables
The options `N files` (`--n-files`) or `File pattern` (`--include-files`) select the files for analysis. For each of the selected files, a blame tab or worksheet is generated, unless the option `Blame skip` is active, see [Blame options GUI](gui.md#blame-options) or [Blame options CLI](cli.md#blame-options).

## Numerical analysis tables

### Default columns

The default columns in the text output and in the Authors sheet of the Excel output follow below.

`Author`
Author name(s). If the same author uses multiple names, they are separated by the `|` symbol.

We define `NrAuthors` as the number of authors that have done commits in the considered repository, excluding any authors matching the `Author` [exclusion pattern](gui.md#exclusion-patterns). The value of `NrAuthors` is used in several formulas that are given below.

`Email`
Email address(es) of `Author`. If the same author uses multiple email addresses, they are separated by the `|` symbol.

`Lines %`
Percentage of lines of code of this author. The author of a line is the author who last changed the line.

`Lines %` = 100 `Lines` / `SumLines`

Where `SumLines` is the sum the values of `Lines` for each of the `NrAuthors` authors of the repository.

`Insertions %`
Percentage of insertions done by this author.

`Insertions %` = 100 `Insertions` / `SumInsertions`

Where `SumInsertions` is the sum of the values of the `Insertions` for each of the `NrAuthors` authors of the repository.

The sum of `Insertions %` of the `NrAuthors` authors equals 100%.

`Lines`
Total number of Lines of the `Author`. The `Author` of a line in a file is the one who made the last change to that line. The author of each line in a file is shown by [Git Blame](https://git-scm.com/docs/git-blame).

`Insertions`
Total number of insertions in in `Repository` done by `Author`.

`Stability %`
`Stability %` = 100 `Lines` / `Insertions`.

For example:

1.  When `Insertions` = `Lines`, we get maximum stability of 100%.
2.  When on average each line is changed once, then

> `Insertions` = 2 `Lines`
>
> since for the initial version of the file `Insertions` = `Lines`. Then
>
> `Stability` = 100 `Lines` / 2 `Lines` = 50%.

`Commits`
Number of commits in `Repository` done by `Author`.

`Deletions`
Total number of deletions in in `Repository` done by `Author`.

`Age`
The average of the ages of the lines inserted by `Author`. `Age` is expressed as `Y-M-D`, as in `1-4-20` meaning one year, 4 months and 20 days old.

1\. The `Age` of an inserted line is the difference between the current
time and the time of the commit of the insertion.

2\. The `Age` of a file is the average of
the ages `Age_i` of each line inserted in the file over the lifetime of the file.

3\. The `Age` of an author is the average of the ages of all lines
inserted by that author.

4\. In general, the `Age` of a combination of authors or files, is the
average of the ages of each inserted line by that combination of authors or files:

`Age` = (`Age_1` + ... + `Age_n`)/`n`

where `n` is the total of all lines inserted by the combination of authors and files over the complete lifetime of the files, including insertions in previous versions of the file in the case of file renames.

### Additional columns

The option `Scaled percentages` inserts for each `%` column, a `Scaled %` column. The average value in each `Scaled %` column for the authors in the repository is always 100, independently of the number of authors. This is achieved by multiplying the `%` column by `NrAuthors` in each repository to get the `Scaled %` column.

`Scaled Lines %`
Scaled percentage of `Lines %`.

`Scaled insertions %`
Scaled percentage of `Insertions %`.

## Blame tables

### HTML and Excel

`ID`
ID of the author shown in the second column. The author with ID 1 is the author of the most lines in the file. The author with ID 2 is the author of the second most lines in the file, and so on. The author of a line in the file in a blame tab or blame sheet is the author who last changed the line. All lines of the same author in the file have the same color. The first six authors have unique colors, the other authors share the same color.

`Author`
The name of the author of the line.

`Date`
Date of the commit.

`Message`
Commit message.

`SHA`
Short, seven character version of the commit hash.

`Commit number`
Number of the commit in the repository, starting with number 1 for the initial commit. The commits or order by the time of the commit.

`Line`
Line number in the file.

`Code`
Code of the line.

### HTML only

For HTML blame output, the Code column has three additional toggle buttons:

`Hide blame exclusions`
The initial state of this button corresponds to the value of the Blame option `Exclude` (`--exclude-blame` in `{hide, show, remove}`).

For the value `hide` (default), the button is initially active. For the value of `show`, the button is initially inactive and for the value of `remove`, the button itself is removed.

When the button is active, the lines that are excluded from the blame analysis as a result of the exclude pattern options, such as `--exclude-files` and `--exclude-authors` are not displayed.

`Hide empty lines`
The initial state of this button corresponds to the value of the Blame inclusions option `Empty lines` (`--empty-lines` or `--no-empty-lines`).

For option `--no-empty-lines`, the `Hide empty lines` button is initially active. For option `--empty-lines`, the button is initially inactive.

When the button is active, empty lines in the blame output are hidden. When the button is inactive and option `exclude-blame` is not set to `remove` and button `Hide blame exclusions` is inactive, the empty lines are shown. When the value of option `--exclude-blame` is set tot `remove`, the button is removed.

`Hide colors`
Removes all colors from the blame lines and shows all lines in white.

### Excel only

For Excel blame output, the values `hide` and `show` of option `--exclude-blame` have no effect. The value `remove`, removes the excluded blame lines from the Excel blame output sheets.
