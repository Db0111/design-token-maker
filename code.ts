figma.showUI(__html__, { width: 300, height: 300 });

function hexToRgb(hex: string) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return { r, g, b };
}

function adjustColor(rgb: { r: number; g: number; b: number }, factor: number) {
  return {
    r: Math.min(1, rgb.r * factor),
    g: Math.min(1, rgb.g * factor),
    b: Math.min(1, rgb.b * factor),
  };
}

figma.ui.onmessage = async (msg: {
  type: string;
  color?: string;
  name?: string;
}) => {
  if (msg.type === "create-token") {
    console.log("📩 message received:", msg);

    const baseHex = msg.color || "#7C3AED";
    const baseRgb = hexToRgb(baseHex);

    // 상태별 자동 색상 생성
    const stateColors = {
      Enabled: baseRgb,
      Hover: adjustColor(baseRgb, 1.15),
      Pressed: adjustColor(baseRgb, 0.8),
      Focus: adjustColor(baseRgb, 1.05),
      Disabled: { r: 0.85, g: 0.85, b: 0.85 },
    };

    const collection = figma.variables.createVariableCollection("Color Tokens");
    const lightModeId = collection.defaultModeId;
    collection.renameMode(lightModeId, "Light");

    const variables: Record<string, Variable> = {};
    for (const [state, rgb] of Object.entries(stateColors)) {
      const variable = figma.variables.createVariable(
        `ColorPrimary${state}`,
        collection,
        "COLOR"
      );
      variable.scopes = ["ALL_FILLS"];
      variable.setValueForMode(lightModeId, rgb);
      variables[state] = variable;
    }

    const states = ["Enabled", "Hover", "Pressed", "Focus", "Disabled"];
    const buttonFrames: FrameNode[] = [];

    await figma.loadFontAsync({ family: "Inter", style: "Regular" });

    states.forEach((state, index) => {
      const frame = figma.createFrame();

      frame.name = `Primary / ${state}`;
      frame.layoutMode = "HORIZONTAL";
      frame.primaryAxisAlignItems = "CENTER";
      frame.counterAxisAlignItems = "CENTER";
      frame.paddingLeft = frame.paddingRight = 16;
      frame.paddingTop = frame.paddingBottom = 5;
      frame.itemSpacing = 8;
      frame.cornerRadius = 8;

      const rect = figma.createRectangle();
      rect.resize(120, 40);
      rect.cornerRadius = 8;

      try {
        const fills = rect.fills as SolidPaint[];
        const boundPaint = figma.variables.setBoundVariableForPaint(
          fills[0],
          "color",
          variables[state]
        );
        rect.fills = [boundPaint];
      } catch (e) {
        rect.fills = [
          {
            type: "SOLID",
            color: stateColors[state as keyof typeof stateColors],
          },
        ];
      }

      const text = figma.createText();
      text.characters = `${state}`;
      text.fontSize = 14;
      text.fills = [
        {
          type: "SOLID",
          color:
            state === "Disabled"
              ? { r: 0.5, g: 0.5, b: 0.5 }
              : { r: 0, g: 0, b: 0 },
        },
      ];
      frame.y = index * 100;

      frame.appendChild(rect);
      frame.appendChild(text);

      buttonFrames.push(frame);
    });

    // Variants로 묶기
    const components: ComponentNode[] = [];

    for (const frame of buttonFrames) {
      const component = figma.createComponentFromNode(frame);
      components.push(component);
    }

    // ComponentSet(Variant Set)
    const componentSet = figma.combineAsVariants(components, figma.currentPage);
    componentSet.name = `Button / ${msg.name}`;

    // Variant Group 속성 지정
    if ("setPropertiesForVariantGroup" in componentSet) {
      (componentSet as ComponentSetNode).setPropertiesForVariantGroup("State", {
        values: states,
      });
    }

    // 기존에 생성된 컨테이너들 찾기
    const existingContainers = figma.currentPage.findAll(
      (n) => n.name === "Button Components"
    );

    // 자동 위치 계산
    let yOffset = 0;
    if (existingContainers.length > 0) {
      const lastContainer = existingContainers[
        existingContainers.length - 1
      ] as FrameNode;
      yOffset = lastContainer.y + lastContainer.height + 80;
    }

    const container = figma.createFrame();
    container.name = "Button Components";
    container.layoutMode = "VERTICAL";
    container.primaryAxisAlignItems = "CENTER";
    container.counterAxisAlignItems = "CENTER";
    container.itemSpacing = 4;
    container.paddingTop = container.paddingBottom = 5;
    container.paddingLeft = container.paddingRight = 40;
    container.resize(300, 600);

    container.x = 0;
    container.y = yOffset;

    // componentSet을 container 안으로 넣기
    container.appendChild(componentSet);

    // 캔버스에 추가
    figma.currentPage.appendChild(container);
    figma.viewport.scrollAndZoomIntoView([container]);

    figma.closePlugin(`✅ ${msg.name} Button Variants created!`);
  }
};
