// @ts-ignore
import { app } from "../../scripts/app.js";
import type {
  LiteGraph as TLiteGraph,
  LGraphCanvas as TLGraphCanvas,
  LGraphGroup as TLGraphGroup,
  SerializedLGraphGroup as TSerializedLGraphGroup
} from "typings/litegraph.js";

declare const LiteGraph: typeof TLiteGraph;
declare const LGraphCanvas: typeof TLGraphCanvas;
declare const LGraphGroup: typeof TLGraphGroup;

type DjLGraphGroup = TLGraphGroup & {
  djHighlight: boolean;
  djFlipColor: string | undefined;
  djToggleHighlight: () => void;
};

function getCanvasFromEvent(e: KeyboardEvent) {
  if (!(e.target as any)?.data) {
    return null;
  }
  return (e.target as any).data;
}

function getGroupUnderMouseForCorrectKeys(e: KeyboardEvent) {
  if (e.code !== 'KeyG' || !e.ctrlKey || !(e.target as any)?.data) {
    return null;
  }
  const canvas = getCanvasFromEvent(e);
  const { graph_mouse = null } = canvas;
  if (!canvas?.graph?.getGroupOnPos || !Array.isArray(graph_mouse) || graph_mouse.length < 2) {
    return null;
  }
  return canvas.graph.getGroupOnPos(graph_mouse[0], graph_mouse[1]) ?? null;
}

function djGroupControls(e: KeyboardEvent) {
  const targetGroup = getGroupUnderMouseForCorrectKeys(e);
  if (!targetGroup) {
    return;
  }
  e.stopPropagation();

  e.preventDefault();
  targetGroup.djToggleHighlight();
  return;
};

function removeHighlightedGroups(e: KeyboardEvent) {
  if (e.code === 'KeyX' && !e.ctrlKey && !e.shiftKey) {
    const { graph } = getCanvasFromEvent(e);
    const { _groups: groups = [] } = graph;
    let groupsToRemove: DjLGraphGroup[] = [];
    // hop to not mutate the array while iterating over it
    groups.forEach((group: DjLGraphGroup) => {
      if (group.djHighlight) {
        groupsToRemove.push(group);
      }
    });
    groupsToRemove.forEach(group => {
      graph.remove(group);

    });
  }
};

app.registerExtension({
  name: 'dotJack.AdvancedGroupControls',
  init() {
    document.addEventListener('keydown', djGroupControls, true);
    document.addEventListener('keydown', removeHighlightedGroups, true);
    const origGroupSerialize = LGraphGroup.prototype.serialize;
    const origGroupConfigure = LGraphGroup.prototype.configure;
    LGraphGroup.prototype.configure = function(o: TSerializedLGraphGroup & DjLGraphGroup) {
      this.djHighlight = o.djHighlight;
      this.djFlipColor = o.djFlipColor;
      origGroupConfigure.apply(this, arguments as any);
    };



    LGraphGroup.prototype.serialize = function() {
      const orig = origGroupSerialize.apply(this, arguments as any) as TSerializedLGraphGroup & DjLGraphGroup
      orig.djHighlight = this.djHighlight;
      orig.djFlipColor = this.djFlipColor;
      return orig;
    };

    // The internals are so convoluted and interwound

    // it's hard to change group drawing  logic
    LGraphCanvas.prototype.drawGroups = function(_canvas, ctx) {
      if (!this.graph) {
        return;
      }

      var groups = this.graph._groups as DjLGraphGroup[]


      ctx.save();
      ctx.globalAlpha = 0.5 * this.editor_alpha;

      for (var i = 0; i < groups.length; ++i) {

        var group = groups.at(i);

        if (!group || !LiteGraph.overlapBounding(this.visible_area, group._bounding)) {
          continue;
        } //out of the visible area


        ctx.fillStyle = group.color || "#335";

        //  Hardcoding how the border is overwritten here
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


        var font_size =
          group.font_size || LiteGraph.DEFAULT_GROUP_FONT_SIZE;
        ctx.font = font_size + "px Arial";

        ctx.textAlign = "left";
        ctx.fillText(group.title, pos[0] + 4, pos[1] + font_size);


      }


      ctx.restore();
    };


    (LGraphGroup.prototype as DjLGraphGroup).djHighlight = false;

    (LGraphGroup.prototype as DjLGraphGroup).djFlipColor = undefined;
    (LGraphGroup.prototype as DjLGraphGroup).djToggleHighlight = function() {
      if (!this.djFlipColor) {
        this.djFlipColor = this.color;
      }
      if (!this.djHighlight) {
        this.djFlipColor = this.color;

        this.color = "#FF0000";
      } else {
        this.color = this.djFlipColor ?? this.color;
      }

      this.djHighlight = !this.djHighlight;
    };
  },
}
);

