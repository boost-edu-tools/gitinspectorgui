# Supported languages

The following table lists the languages that are supported by the analysis tool.
The table includes the language name, whether comments are supported, the file
extensions that are recognized, and whether the language is included in the
analysis by default.

Support of comments is relevant only for blame analysis. By means of the option
`--comments`, the user can specify whether whole line comments should be
included in the blame calculations, see {ref}`CLI comments <cli-comments>` and
{ref}`GUI comments <gui-comments>`.

By specifying the asterisk as one of the file extensions, the analysis tool will
include all files in the analysis. The only difference between the supported and
unsupported languages, is that comments are not supported for the latter and
unsupported languages are not included in the analysis by default.

```{eval-rst}
.. list-table::

  * - Language
    - Comments
    - File extensions
    - Included in analysis by default
  * - C
    - Yes
    - c, h
    - Yes
  * - C++
    - Yes
    - cc, h, hh, hpp
    - Yes
  * - CIF
    - Yes
    - cif
    - Yes
  * - Java
    - Yes
    - java
    - Yes
  * - JavaScript
    - Yes
    - js
    - Yes
  * - OpenGL Shading Language
    - Yes
    - glsl
    - Yes
  * - Python
    - Yes
    - py
    - Yes
  * - Ruby
    - Yes
    - rb
    - Yes
  * - SQL
    - Yes
    - sql
    - Yes
  * - ADA
    - Yes
    - ada, adb, ads
    - No
  * - C#
    - Yes
    - cs
    - No
  * - GNU Gettext
    - Yes
    - po, pot
    - No
  * - Haskell
    - Yes
    - hs
    - No
  * - HTML
    - Yes
    - html
    - No
  * - LaTeX
    - Yes
    - tex
    - No
  * - OCaml
    - Yes
    - ml, mli
    - No
  * - Perl
    - Yes
    - pl
    - No
  * - PHP
    - Yes
    - php
    - No
  * - Scala
    - Yes
    - scala
    - No
  * - ToolDef
    - No
    - tooldef
    - No
  * - XML
    - Yes
    - xml, jspx
    - No
```

