figma.showUI(__html__, { width: 400, height: 500 });

// HEX → RGB 변환
function hexToRgb(hex: string) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return { r, g, b };
}

// 색상 밝기 조절 (Hover/Pressed용)
function adjustColor(rgb: { r: number; g: number; b: number }, factor: number) {
  return {
    r: Math.min(1, rgb.r * factor),
    g: Math.min(1, rgb.g * factor),
    b: Math.min(1, rgb.b * factor),
  };
}

figma.ui.onmessage = async (msg: {
  type: string;
  primaryColor?: string;
  secondaryColor?: string;
  dangerColor?: string;
  name?: string;
}) => {
  if (msg.type !== "create-token") return;

  console.log("📩 message received:", msg);

  const BUTTON_TYPES: Record<string, string> = {
    Primary: msg.primaryColor || "#7C3AED",
    Secondary: msg.secondaryColor || "#6B7280",
    Ghost: msg.primaryColor || "#7C3AED",
    Text: msg.primaryColor || "#7C3AED",
    Danger: msg.dangerColor || "#DC2626",
  };

  const states = ["Enabled", "Hover", "Pressed", "Focus", "Disabled"];

  // 전체 컨테이너
  const mainContainer = figma.createFrame();
  mainContainer.name = "Button Variants";
  mainContainer.layoutMode = "VERTICAL";
  mainContainer.primaryAxisAlignItems = "CENTER";
  mainContainer.counterAxisAlignItems = "CENTER";
  mainContainer.itemSpacing = 24;
  mainContainer.paddingTop = 60;
  mainContainer.paddingBottom = 60;
  mainContainer.paddingLeft = 80;
  mainContainer.paddingRight = 80;
  mainContainer.counterAxisSizingMode = "AUTO";
  mainContainer.resize(1000, 600);

  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  for (const state of states) {
    const rowFrame = figma.createFrame();
    rowFrame.name = `${state} Row`;
    rowFrame.layoutMode = "HORIZONTAL";
    rowFrame.primaryAxisAlignItems = "CENTER";
    rowFrame.counterAxisAlignItems = "CENTER";
    rowFrame.itemSpacing = 40; // 버튼 간격 조금 줄여도 깔끔해요
    rowFrame.paddingTop = 10;
    rowFrame.paddingBottom = 10;
    rowFrame.counterAxisSizingMode = "AUTO";

    const labelFrame = figma.createFrame();
    labelFrame.layoutMode = "VERTICAL";
    labelFrame.primaryAxisAlignItems = "CENTER";
    labelFrame.counterAxisAlignItems = "CENTER";
    labelFrame.resize(80, 40);
    labelFrame.fills = [];
    labelFrame.strokes = [];

    const label = figma.createText();
    label.characters = `${state}`;
    label.fontSize = 14;
    label.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
    label.textAlignHorizontal = "CENTER";
    label.textAlignVertical = "CENTER";

    labelFrame.appendChild(label);
    rowFrame.appendChild(labelFrame);

    for (const [buttonType, baseHex] of Object.entries(BUTTON_TYPES)) {
      const baseRgb = hexToRgb(baseHex);
      const stateColors = {
        Enabled: baseRgb,
        Hover: adjustColor(baseRgb, 1.15),
        Pressed: adjustColor(baseRgb, 0.85),
        Focus: adjustColor(baseRgb, 1.05),
        Disabled: { r: 0.85, g: 0.85, b: 0.85 },
      };

      const frame = figma.createFrame();
      frame.name = `${buttonType} / ${state}`;
      frame.layoutMode = "NONE";
      frame.resize(120, 40);
      frame.cornerRadius = 8;

      const rect = figma.createRectangle();
      rect.resize(120, 40);
      rect.cornerRadius = 8;

      // 💡 버튼 타입별 스타일
      if (buttonType === "Ghost") {
        rect.strokes = [
          {
            type: "SOLID",
            color:
              state === "Disabled"
                ? { r: 0.8, g: 0.8, b: 0.8 }
                : stateColors.Enabled,
          },
        ];
        rect.strokeWeight = 1.5;

        if (state === "Hover") {
          rect.fills = [
            {
              type: "SOLID",
              color: stateColors.Enabled,
              opacity: 0.08, // subtle fill
            },
          ];
        } else if (state === "Pressed") {
          rect.fills = [
            {
              type: "SOLID",
              color: stateColors.Enabled,
              opacity: 0.16,
            },
          ];
        } else if (state === "Focus") {
          rect.fills = [
            {
              type: "SOLID",
              color: stateColors.Enabled,
              opacity: 0.1,
            },
          ];
          rect.strokes = [
            {
              type: "SOLID",
              color: stateColors.Enabled,
            },
          ];
        } else {
          rect.fills = [];
        }
      } else if (buttonType === "Text") {
        rect.strokes = [];

        if (state === "Hover") {
          rect.fills = [
            {
              type: "SOLID",
              color: stateColors.Enabled,
              opacity: 0.1,
            },
          ];
        } else if (state === "Pressed") {
          rect.fills = [
            {
              type: "SOLID",
              color: stateColors.Enabled,
              opacity: 0.2,
            },
          ];
        } else if (state === "Focus") {
          rect.fills = [
            {
              type: "SOLID",
              color: stateColors.Enabled,
              opacity: 0.1,
            },
          ];
          rect.strokes = [
            {
              type: "SOLID",
              color: stateColors.Enabled,
            },
          ];
          rect.dashPattern = [2, 2];
        } else {
          rect.fills = [];
        }
      } else {
        rect.fills = [
          {
            type: "SOLID",
            color:
              state === "Disabled"
                ? { r: 0.85, g: 0.85, b: 0.85 }
                : stateColors[state as keyof typeof stateColors],
          },
        ];
      }

      const text = figma.createText();
      text.characters = "버튼 Button";
      text.fontSize = 14;
      text.textAlignHorizontal = "CENTER";
      text.textAlignVertical = "CENTER";

      if (buttonType === "Ghost" || buttonType === "Text") {
        text.fills = [
          {
            type: "SOLID",
            color:
              state === "Disabled"
                ? { r: 0.6, g: 0.6, b: 0.6 }
                : stateColors.Enabled,
          },
        ];
      } else {
        text.fills = [
          {
            type: "SOLID",
            color:
              state === "Disabled"
                ? { r: 0.6, g: 0.6, b: 0.6 }
                : { r: 1, g: 1, b: 1 },
          },
        ];
      }

      // 텍스트를 중앙 정렬
      text.x = (rect.width - text.width) / 2;
      text.y = (rect.height - text.height) / 2;

      frame.appendChild(rect);
      frame.appendChild(text);
      rowFrame.appendChild(frame);
    }

    mainContainer.appendChild(rowFrame);
  }

  figma.currentPage.appendChild(mainContainer);
  figma.viewport.scrollAndZoomIntoView([mainContainer]);

  figma.closePlugin("✅ Button Variant 생성 완료 !");
};
