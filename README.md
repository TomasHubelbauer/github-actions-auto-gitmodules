# GitHub Actions Auto-`.gitmodules`

Git supports a feature named Submodules.
It can be used to link another repository as a dependency of the current one.

Here is the documentation: https://git-scm.com/book/en/v2/Git-Tools-Submodules

Here's how you add a submodule to a repository:

```sh
git submodule add https://github.com/TomasHubelbauer/git-demo-submodule
```

This will clone the linked repository into a directory named after it and it
will create or update a file name `.gitmodules` with the details of the new
submodule.

To remove a submodule, this is the command to use:

```sh
git rm git-demo-submodule
```

The source for this command can be found on Stack Overflow here:
https://stackoverflow.com/a/1260982/2715716

You can add `-f` if the submodule addition has not been committed yet or the
submodule has changes.

To check out or pull a repository with all its submodules, one must use these
commands:

```sh
git clone https://github.com/TomasHubelbauer/github-actions-auto-gitmodules --recurse-submodules
```

Adding `--remote-submodules` will also update submodules to latest.

```sh
git submodule update --recursive --remote
```

The idea of this GitHub Actions workflow is to add logic which runs on every
push and checks for updates into `.gitmodules` made by the user in the GitHub
web UI and then add or remove submodules to match the changes made by the user
and push the changes from the workflow back to the repository.
