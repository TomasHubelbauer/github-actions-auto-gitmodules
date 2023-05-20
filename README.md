# GitHub Actions Auto-`.gitmodules`

Git supports a feature named Submodules.
It can be used to link another repository as a dependency of the current one.

Here is the documentation: https://git-scm.com/book/en/v2/Git-Tools-Submodules

I made a GitHub Action which when run automatically looks at the `.gitmodules`
file and if a new entry is added or removed, adds the remaining bits Git needs
to add the submodule or removes them, respectively.

This makes it possible to add and remove Git Modules just by editing the
`.gitmodules` file in the GitHub web code editor and doesn't require one to
clone the repository and push the change themselves.

It is achieved by doing to push for the user from the GitHub Actions workflow.

The GitHub Action repository is here:
https://github.com/TomasHubelbauer/github-action-auto-git-modules
