# Developer info

## Working with TestPyPI

Before publishing to PyPI, the code and publishing scripts can be tested via
TestPyPI.

### Prepare the package for TestPyPI

- `uv build` to create the package.

### Publish to TestPyPI via uv

```{code} bash
uv publish --index testpypi --username __token__ --password AUTHENTICATION-TOKEN
```

Here `__token__` should be entered as is, and `AUTHENTICATION-TOKEN` should
be replaced with the (very long) token generated from the TestPyPI account.

### Download gitinspectorgui from TestPyPI

The problem with downloading gitinspectorgui from TestPyPI is that pip will also
try to download the required dependencies from TestPyPI, whereas the
dependencies should be downloaded from PyPI. Therefore, instead of the command
`pip install -i https://test.pypi.org/simple/ gitinspectorgui` shown at
TestPyPI, use the following command:

```{code} bash
pip install --pre --index-url https://test.pypi.org/simple/ \
    --extra-index-url https://pypi.org/simple/ gitinspectorgui
```

The `--pre` flag is required because the version on TestPyPI is a pre-release.

When using release candidates, the version number should be specified, e.g.:

```{code} bash
pip install --pre --index-url https://test.pypi.org/simple/ \
    --extra-index-url https://pypi.org/simple/ gitinspectorgui==0.4.0rc7
```

