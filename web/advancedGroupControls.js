import { app } from "../../scripts/app.js";
function getCanvasFromEvent(e) {
  if (!e.target?.data) {
    return null;
  }
  return e.target.data;
}
function getGroupUnderMouseForCorrectKeys(e) {
  if (e.code !== 'KeyG' || !e.ctrlKey || !e.target?.data) {
    return null;
  }
  const canvas = getCanvasFromEvent(e);
  const { graph_mouse = null } = canvas;
  if (!canvas?.graph?.getGroupOnPos || !Array.isArray(graph_mouse) || graph_mouse.length < 2) {
    return null;
  }
  return canvas.graph.getGroupOnPos(graph_mouse[0], graph_mouse[1]) ?? null;
}
function djGroupControls(e) {
  const targetGroup = getGroupUnderMouseForCorrectKeys(e);
  if (!targetGroup) {
    return;
  }
  e.stopPropagation();
  e.preventDefault();
  targetGroup.djToggleHighlight();
  return;
}
;
function removeHighlightedGroups(e) {
  if (e.code === 'KeyX' && !e.ctrlKey && !e.shiftKey) {
    const { graph } = getCanvasFromEvent(e);
    const { _groups: groups = [] } = graph;
    let groupsToRemove = [];
    groups.forEach((group) => {
      if (group.djHighlight) {
        groupsToRemove.push(group);
      }
    });
    groupsToRemove.forEach(group => {
      graph.remove(group);
    });
  }
}
;
app.registerExtension({
  name: 'dotJack.AdvancedGroupControls',
  init() {
    document.addEventListener('keydown', djGroupControls, true);
    document.addEventListener('keydown', removeHighlightedGroups, true);
    const origGroupSerialize = LGraphGroup.prototype.serialize;
    const origGroupConfigure = LGraphGroup.prototype.configure;
    LGraphGroup.prototype.configure = function(o) {
      this.djHighlight = o.djHighlight;
      this.djFlipColor = o.djFlipColor;
      origGroupConfigure.apply(this, arguments);
    };
    LGraphGroup.prototype.serialize = function() {
      const orig = origGroupSerialize.apply(this, arguments);
      orig.djHighlight = this.djHighlight;
      orig.djFlipColor = this.djFlipColor;
      return orig;
    };
    LGraphCanvas.prototype.drawGroups = function(_canvas, ctx) {
      if (!this.graph) {
        return;
      }
      var groups = this.graph._groups;
      ctx.save();
      ctx.globalAlpha = 0.5 * this.editor_alpha;
      for (var i = 0; i < groups.length; ++i) {
        var group = groups.at(i);
        if (!group || !LiteGraph.overlapBounding(this.visible_area, group._bounding)) {
          continue;
        }
        ctx.fillStyle = group.color || "#335";
        ctx.strokeStyle = group.djHighlight ? '#FFF' : group.color || "#335";
        var pos = group._pos;
        var size = group._size;
        ctx.globalAlpha = 0.25 * this.editor_alpha;
        ctx.beginPath();
        ctx.rect(pos[0] + 0.5, pos[1] + 0.5, size[0], size[1]);
        ctx.fill();
        ctx.globalAlpha = this.editor_alpha;
        ctx.lineTo(pos[0] + size[0] - 10, pos[1] + size[1]);
        ctx.lineTo(pos[0] + size[0], pos[1] + size[1] - 10);
        ctx.fill();
        var font_size = group.font_size || LiteGraph.DEFAULT_GROUP_FONT_SIZE;
        ctx.font = font_size + "px Arial";
        ctx.textAlign = "left";
        ctx.fillText(group.title, pos[0] + 4, pos[1] + font_size);
      }
      ctx.restore();
    };
    LGraphGroup.prototype.djHighlight = false;
    LGraphGroup.prototype.djFlipColor = undefined;
    LGraphGroup.prototype.djToggleHighlight = function() {
      if (!this.djFlipColor) {
        this.djFlipColor = this.color;
      }
      if (!this.djHighlight) {
        this.djFlipColor = this.color;
        this.color = "#FF0000";
      }
      else {
        this.color = this.djFlipColor ?? this.color;
      }
      this.djHighlight = !this.djHighlight;
    };
  },
});
