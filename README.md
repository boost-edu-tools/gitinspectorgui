# GitInspectorGUI rewrite

## How to Run
For now, only the GUI can be launched. One can do this as follows:
1. Make sure Rust, Node.js and pnpm are installed. If not, installing the latest (or LTS) versions will do.
2. From the base directory, do `cd ./gui`
3. Then, install all packages by running `pnpm install`
4. Once installed, run the GUI by running `pnpm tauri dev`

**More installation and running instructions will follow here soon!**

## Global Component Overview

### GUI
Within this rewrite branch, the GUI will stay as it is until it works on the new engine.

### CLI
For sake of completeness, as @Jelco-C already made a start on a rust-based CLI, we will include it in this branch, to make testing the Core easier. This will be placed in the `cli` crate. The CLI functionality will grow with the core functionality, staying relatively similar to the gitinspectorgui-old syntax.

### Core
We will rewrite the whole Gitinspectorgui in Rust. Due to Rust being fundamentally different to Python, the [old Gitinspectorgui engine](https://github.com/boost-edu-tools/gitinspectorgui-old/tree/main/src/gigui) (not the engine found in this repository!) will be broken down in parts, and rebuilt piece by piece. 
First, we'll implement an API file in the core, for the cli and gui to be built on. Then, we will reimplement the features in `lib.rs` in the following order:

1. `repo_base.py` functionality: This file contains the main analysis, which is the first we'll rebuild. In the Python implementation, it uses data classes. In Rust, we will implement these in their respective data structures in the the `shared-types`, while the repo_base functionality will be written in the `core` crate. The `person_data` functionality will be skipped, instead, each author will be seen as distinct person.

2. A module in the `core` crate will be made to deal with inputs and outputs from the GUI and CLI, the so-called API. This API will grow with the expansion of the core.

3. Building upon `repo_base.py`, we will implement the functionality of `repo_data.py`. Again, the `person_data.py` functionality will be skipped.

4. `repo_blame.py` functionality will be made. 

5. `person_data.py` functionality will be the last major function to be re-implemented. 

<br></br>
This branch has reached its goal when it functions at least as well as the current implementation in the main branch.

