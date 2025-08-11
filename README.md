# GitInspectorGUI rewrite
**Installation and Running Instructions will follow here soon!**
<br></br>

This README will describe what will happen to each of the GitinspectorGUI components, and how.

### GUI
Within this rewrite branch, the GUI will stay as it is until it works on the new engine.

### CLI
For sake of completeness, as @Jelco-C already made a start on a rust-based CLI, we will include it in this branch, to make testing the Core easier. This will be placed in the `cli` crate. The CLI functionality will grow with the core functionality, staying relatively similar to the gitinspectorgui-old syntax.

### Core
We will rewrite the whole Gitinspectorgui in Rust. Due to Rust being fundamentally different to Python, the [old Gitinspectorgui engine](https://github.com/boost-edu-tools/gitinspectorgui-old/tree/main/src/gigui) (not the engine found in this repository!) will be broken down in parts, and rebuilt piece by piece. We will reimplement the features in the following order:

1. `repo_base.py` functionality: This file contains the main analysis, which is the first we'll rebuild. In the Python implementation, it uses data classes. In Rust, we will implement these in their respective data structures in the the `shared-types`, while the repo_base functionality will be written in the `core` crate. The `person_data` functionality will be skipped, instead, each author will be seen as distinct person.

2. A module in the `core` crate will be made to deal with inputs and outputs from the GUI and CLI, the so-called API. This API will grow with the expansion of the core.

3. Building upon `repo_base.py`, we will implement the functionality of `repo_data.py`. Again, the `person_data.py` functionality will be skipped.

4. `repo_blame.py` functionality will be made. 

5. `person_data.py` functionality will be the last major function to be re-implemented. 

<br></br>
This branch has reached its goal when it functions at least as well as the current implementation in the main branch.

