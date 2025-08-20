
## For GitinspectorGUI

Version 0.2 
Prepared by Max den Oudsten
20-08-2025

## Table of Contents
---
* [Revision History](#revision-history)
* 1 [Introduction](#1-introduction)
  * 1.1 [Document Purpose](#11-document-purpose)
  * 1.2 [Product Scope](#12-product-scope)
  * 1.3 [Definitions, Acronyms and Abbreviations](#13-definitions-acronyms-and-abbreviations)
  * 1.4 [References](#14-references)
  * 1.5 [Document Overview](#15-document-overview)
* 2 [Product Overview](#2-product-overview)
  * 2.1 [Product Perspective](#21-product-perspective)
  * 2.2 [Product Functions](#22-product-functions)
  * 2.3 [Product Constraints](#23-product-constraints)
  * 2.4 [User Characteristics](#24-user-characteristics)
  * 2.5 [Assumptions and Dependencies](#25-assumptions-and-dependencies)
* 3 [Requirements](#3-requirements)
  * 3.1 [External Interfaces](#31-external-interfaces)
    * 3.1.1 [User Interfaces](#311-user-interfaces)
    * 3.1.2 [Software Interfaces](#312-software-interfaces)
  * 3.2 [Functional](#32-functional)
  * 3.3 [Quality of Service](#33-quality-of-service)
    * 3.3.1 [Performance](#331-performance)
    * 3.3.2 [Security](#332-security)
    * 3.3.3 [Reliability](#333-reliability)
  * 3.4 [Design and Implementation](#34-design-and-implementation)
    * 3.4.1 [Installation](#341-installation)
    * 3.4.2 [Distribution](#342-distribution)
    * 3.4.3 [Maintainability & Reusability](#343-maintainability-&-reusability)
    * 3.4.4 [Deadline](#344-deadline)
* 4 [Verification](#4-verification)

## Revision History
| Name            | Date       | Reason For Changes      | Version |
| --------------- | ---------- | ----------------------- | ------- |
| Max den Oudsten | 19-08-2025 | Initial setup.          | v0.1    |
| Max den Oudsten | 20-08-2025 | Fix broken links in ToC | v0.2    |
|                 |            |                         |         |

## 1. Introduction
---
### 1.1 Document Purpose
Describe the purpose of the SRS and its intended audience. GitinspectorGUI is a rust-based git repository analysis tool, meant for professors, assistant professors or student assistants at Eindhoven University of Technology (TU/e) having to grade git-based assignments. Although GitinspectorGUI tailored for the [4TC00 Model-based Systems Engineering](https://boost.tue.nl/projects/model-based-systems-engineering/) course, it is open-source and available for anyone willing to analyse their git repositories.

### 1.2 Product Scope
GitinspectorGUI's mission is to make the process of grading git-based assignments easier for the end user. It tries to achieve this by analysing git-based repositories, and generate several statistics, as well as git blames per commit. This makes Git a dependency, meaning it has to be installed prior to using GitinspectorGUI. Users can interact with the software through two interfaces, a GUI and CLI. Both interfaces rely on the same core logic, meaning both interfaces will have access to the full feature set. The software will lessen the workload for (assistant) professors or student assistants on grading assignments by providing a clear and coherent overview the students' work. Furthermore, it will work on most desktop operating systems, namely Windows, MacOS and Linux.

### 1.3 Definitions, Acronyms and Abbreviations
1. **"GitinspectorGUI"**: name of the software subject to this software requirements specification.
2. **"The software"**: refers to GitinspectorGUI.
3. **GUI**: Graphical User interface.
4. **CLI**: Command Line Interface.
5. **Rust**: a compiled programming language.
6. **Rust crate**: A package of code written in the Rust language, usually published on a package registry.

### 1.4 References
<!-- List any other documents or Web addresses to which this SRS refers. These may include user interface style guides, contracts, standards, system requirements specifications, use case documents, or a vision and scope document. Provide enough information so that the reader could access a copy of each reference, including title, author, version number, date, and source or location. -->

### 1.5 Document Overview
From here on, a more specific product overview is given, followed by the software's requirements, ending with a verification section, describing the methods used to verify the requirements.

## 2. Product Overview
---
This section should describe the general factors that affect the product and its requirements. This section does not state specific requirements. Instead, it provides a background for those requirements, which are defined in detail in Section 3, and makes them easier to understand.

### 2.1 Product Perspective
GitinspectorGUI originates from the need of Version Control support in a Mechanical Engineering course at the TU/e. The tool should specifically make the workflow of gathering statistics on multiple repositories quicker and easier. Although GitinspectorGUI is part of a project under TU/e's BOOST initiative, it will serve as a self-contained product, as the software may be of use in many other settings, besides the university setting. 

### 2.2 Product Functions
GitinspectorGUI will have the following major functions:
- Open one or more Git repositories, by either selecting the folder of the Git repository or selecting a folder containing folders of Git repositories.
- Generate global repository statistics, like amount of branches, amount of contributors, total LOCs and file type distributions.
- Generate statistics per author, like LOCs written, amount of insertions and deletions, percentage of contributions.
- Display these statistics in the GUI, using easy-to-read graphs and diagrams where these provide added value.
- Generate outputs from the CLI, allowing different formats.
- Configure settings which are saved and used between sessions.

### 2.3 Product Constraints
GitinspectorGUI has the following constraints:
- Users will be on Windows, MacOS or Linux, all of which should be supported.
- Statistics generated should be deterministic.
- Interfaces will be in English.
- Repository analysis time should not be linear to the amount of repositories to be analysed.
- The software shall be open source.
- The software will be released as Rust crate.
- The software will be distributed through platform-specific installers.

### 2.4 User Characteristics
There are two main user classes which will make use of GitinspectorGUI. They are listed in order of importance:
1. **University staff**: this class includes professors, assistant professors and student assistants. This is the most important class, given the origin of this software. Proper knowledge on Git or Version Control in general cannot be assumed for this class. This class is expected to use the GUI almost exclusively.
2. **Developers**: this class captures anyone with some Computer Science knowledge, specifically with proper knowledge on Git. Besides using the GUI occasionally, this class is expected to use the CLI a lot more than **university staff**, given the somewhat more complicated nature of a CLI.
### 2.5 Assumptions and Dependencies
A few assumptions are made for this software to work properly:
1. The user has Git installed.
2. The user is on Windows, MacOS or Linux.

## 3. Requirements
---
The requirements specify the functionality of the software such that implementation details are excluded, leaving these to the developers' interpretations. Furthermore, they are specific enough for testers to test whether the software satisfies the requirements. 

### 3.1 External Interfaces
This subsection defines all the inputs into and outputs requirements of the software system.
#### 3.1.1 User interfaces
- 1.1 GitinspectorGUI shall provide a Graphical User Interface (GUI).
	- 1.1.1 The GUI shall provide 
- 1.2 GitInspectorGUI shall provide a Command Line Interface (CLI).

#### 3.1.2 Software interfaces
GitinspectorGUI will interface with the following software:
- Windows, specifically versions 10 and 11.
- Linux, specifically Debian based distributions.
- MacOS, version 10.13 and above.
- Git, version 2.45 and above.
- Rust, version 1.89 and above.
- Node.js, version 22.18.0 (LTS)


### 3.2 Functional
This section specifies the requirements of functional effects that the software-to-be is to have on its environment.

- 1. GitinspectorGUI shall provide functionality to analyse Git repositories.
	- 1.1 GitinspectorGUI shall provide the following information on the Git repository's authors:
		- Name
		- Email
	- 1.2 GitinspectorGUI shall provide the following statistics on the Git repository's authors:
		- LOCs assigned to author
		- Amount of insertions
		- Amount of deletions
		- Amount of commits
		- Percentage of LOCs, insertions, deletions and commits among all authors
	- 1.3 GitinspectorGUI shall provide the following overview on the Git repository's files:
		- File name
		- File path
		- File extension
		- LOCs
		- SLOCs (for supported extensions only)
		- Amount of commits that affected the file
		- Authors that worked on it
		- Percentage of LOCs, SLOCs, insertions, deletions and commits among all authors
	- 1.4 GitinspectorGUI shall provide information per file in the Git repository.
		- 1.4.1 GitinspectorGUI shall provide the following information per line:
			- Line number
			- Author
			- Date
			- Commit message
			- Commit SHA
			- Commit number
			- Code written in the line
		- 1.4.2: GitinspectorGUI shall provide the information mentioned in requirement 1.4.1 on a per commit basis.
- 2. GitinspectorGUI shall allow the user to select one or more repositories to analyse.
	- 2.1 GitinspectorGUI shall allow the user to select a single Git repository.
	- 2.2 GitinspectorGUI shall allow the user to select multiple Git repositories at the same time.
	- 2.3 GitinspectorGUI shall not allow the user to select any other file that is not a Git repository.
- 3. GitinspectorGUI shall allow the user to manipulate settings regarding the analysis process.
	- 3.1 GitinspectorGUI shall allow the user to change settings regarding the analysis process through all its interfaces.
	- 3.2 GitinspectorGUI shall provide the user with a method to export the currently selected settings.
	- 3.3 GitinspectorGUI shall provide the user with a method to import settings.
- 4. GitinspectorGUI shall allow the user to analyse all selected Git repositories.
	- 4.1 GitinspectorGUI shall display the results of the analysis in the GUI interface.
		- 4.1.1 In case of multiple repositories analysed, GitinspectorGUI will provide a way to select one of the analysed repositories.
	- 4.2 GitinspectorGUI shall output the results of the analysis in the CLI console.
- 5. GitinspectorGUI shall allow the user to export the results of the analysis.
	- 5.1 GitinspectorGUI shall provide two export formats: HTML and JSON.
- 6. GitinspectorGUI shall allow the user to import the results of the analysis.
	- 6.1 GitinspectorGUI shall only allow the user to import JSON files.
- 7. GitinspectorGUI shall allow the user to update the software in-app.
	- 7.1 GitinspectorGUI shall allow a user using the GUI to update the software through the GUI interface.
	- 7.2 GitinspectorGUI shall contain a command for a user to update the software through the CLI interface.
### 3.3 Quality of Service
This section states additional, quality-related property requirements that the functional effects of the software should present.

#### 3.3.1 Performance
- 1. If multiple repositories need to be analysed, GitinspectorGUI will do this concurrently.
- 2. If multiple repositories need to be analysed, GitinspectorGUI will do this dynamically. <!-- Meaning we don't wait for all repositories to finish, we instead display results of each repository once finished -->

#### 3.3.2 Security
- 1. GitinspectorGUI shall be available offline.
	- 1.1 GitinspectorGUI shall require an internet connection for updating the software.
- 2. GitinspectorGUI shall only access files appointed to by the user.
- 3. GitinspectorGUI shall only manipulate processes which it started itself.

#### 3.3.3 Reliability
- 1. If one or more repositories fail to analyse, GitinspectorGUI shall give the user the option to restart the analysis.
- 2. GitinspectorGUI shall run the analysis process separately from the interfaces.


### 3.4 Design and Implementation

#### 3.4.1 Installation
Constraints to ensure that the software-to-be will run smoothly on the target implementation platform.
1. GitinspectorGUI shall be compiled on devices running the target operating systems.

#### 3.4.2 Distribution
Constraints on software components to fit the geographically distributed structure of the host organization, the distribution of data to be processed, or the distribution of devices to be controlled.
- 1. GitinspectorGUI's codebase shall be made available through GitHub.
- 2. GitinspectorGUI's installers shall be made available through GitHub.
- 3. GitinspectorGUI's updates shall be made available through the interfaces.

#### 3.4.3 Maintainability & Reusability
1. The interfaces shall never be coupled together.
2. All subsystems of the software shall communicate using pre-defined types.

#### 3.4.4 Deadline
1. On October 1st, a soft deadline has been set, assuming a working prototype to be finished to be shown in a demo during an event.
2. December 31st 2026 is the hard deadline of this project.

## 4. Verification
---
The software will be tested against the set requirements using the following methods:
1. Testing: unit, integration and system tests will be written to test the codebase against the applicable requirements.
2. Reviews: involve stakeholders to test particular features against the set requirements.
3. Analysis: Static and dynamic analysis of the codebase helps verify the software against the set requirements.
