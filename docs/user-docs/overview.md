# Overview

## Features

The Python `gitinspectorgui` tool facilitates detailed quantitative analysis of the contribution of each author to selected repositories.

HTML and Excel backends  
The html and Excel backends provide detailed Git statistics:

- per author
- per author subdivided by file
- per file subdivided by author
- per file

They also provide detailed blame information for each file. All output lines are colored by author, allowing for easy visual inspection and tracking of author contributions.

GUI and CLI interface  
The GUI and CLI interface have the same options and functionality.

Available as executable app and PyPI package  
Executable apps with GUI interface are available for macOS and Windows. In addition, a Python package can be installed from [PyPI](https://pypi.org/project/gitinspectorgui/).

## Origin

Development of GitinspectorGUI started as an update and extension of the [gitinspector](https://github.com/ejwa/gitinspector) CLI tool by Adam Waldenberg. Recently, GitinspectorGUI has been completely rewritten and no longer uses any code from the gitinspector tool.

## License

GitinspectorGUI is released under the permissive MIT license. The GUI is based on the PySimpleGUI version from pysimplegui-4-foss at PyPI, which is LGPL licensed. We are working on an additional GUI interface based on [DearPyGUI](https://github.com/hoffstadt/DearPyGui), which is MIT licensed.

## GitinspectorGUI team

For the first few years, all development work based on the GPL3 gitinspector version from Adam Waldenberg was done by Jingjing Wang. The rewrite to the MIT version was done by Bert van Beek, with additional contributions from Albert Hofkamp. Work on GitinspectorGUI is part of the TU/e BOOST project [Time and Place Independent Learning](https://boost.tue.nl/projects/ict-tools-to-support-tpil-in-project-groups/).
