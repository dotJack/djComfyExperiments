# djComfyExperiments
ComfyUi tweaks, extensions, experiments, etc in case my computer explodes.

## Usage? (why would you)

### advandedGroupControls

Why to use?

Group interface blows.
One consistent thing that bothers me is how tricky it is to delete a group.

This hack adds an option to hit **Ctrl + G** to highlight a group if hovering over a group.
You can highlight multiple groups.
Afterwards you can hit **x** to delete all the highlighted groups.

It might have unintended consequences but the highlight persists in the workflow and the **x** will bubble up from everything that isn't an input field.
If the workflow with a highlighted node is ported to a project without this extension,
it might show up red but nothing should break (white stroke won't be persisted though)

How to use?

Drop into web/extensions/dotJack/ folder (or choose your own folder?)

## References / Attributions
A lot of the core setup has been hacked together based on [rgthree/rgthree-comfy](https://github.com/rgthree/rgthree-comfy) repo.

