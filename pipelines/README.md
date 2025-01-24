# Pipelines

## Setup

Issue these commands from the project root directory

1. Install `pipenv`.
2. Run `pipenv install`.
3. Add a `.env` file with at least the following line:
   ```cfg
   PYTHONPATH=<PROJECT ROOT>/pipelines
   ```
   `<PROJECT ROOT>` should be replaced with the full path to your project.
   This should then work in Jupyter and DVC.
4. Load the shell with `pipenv shell`.
