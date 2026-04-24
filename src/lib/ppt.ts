import pptxgen from "pptxgenjs";
import { PresentationData, SlideContent } from "./gemini";

export interface PptTheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  accentColor: string;
  fontFace: string;
}

export const THEMES: PptTheme[] = [
  {
    name: "Modern Professional",
    primaryColor: "2C3E50",
    secondaryColor: "E74C3C",
    textColor: "333333",
    accentColor: "3498DB",
    fontFace: "Arial"
  },
  {
    name: "Academic Minimal",
    primaryColor: "1A1A1A",
    secondaryColor: "666666",
    textColor: "000000",
    accentColor: "999999",
    fontFace: "Times New Roman"
  },
  {
    name: "Vibrant Tech",
    primaryColor: "6C5CE7",
    secondaryColor: "A29BFE",
    textColor: "2D3436",
    accentColor: "00CEC9",
    fontFace: "Verdana"
  },
  {
    name: "Nature Scientific",
    primaryColor: "27AE60",
    secondaryColor: "2ECC71",
    textColor: "2C3E50",
    accentColor: "F1C40F",
    fontFace: "Calibri"
  }
];

export async function generatePpt(data: PresentationData, theme: PptTheme) {
  const pptx = new pptxgen();
  
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "Manuscript AI";
  pptx.company = "AI Studio Build";
  pptx.title = data.title;

  const getImageUrl = (keyword: string) => `https://picsum.photos/seed/${encodeURIComponent(keyword)}/800/600`;

  // Title Slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: "FFFFFF" };
  
  // Decorative background shapes
  titleSlide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: "100%", h: "100%",
    fill: { color: "F8F9FA" }
  });
  
  titleSlide.addShape(pptx.ShapeType.triangle, {
    x: 7, y: 0, w: 3, h: 3,
    fill: { color: theme.primaryColor, transparency: 80 },
    flipH: true
  });

  titleSlide.addText(data.title, {
    x: 1, y: 2, w: "80%", h: 1.5,
    fontSize: 48,
    bold: true,
    color: theme.primaryColor,
    fontFace: theme.fontFace,
    align: "center",
    shadow: { type: "outer", color: "666666", blur: 3, offset: 2, angle: 45 }
  });

  titleSlide.addText(data.subtitle, {
    x: 1, y: 3.5, w: "80%", h: 1,
    fontSize: 24,
    color: theme.secondaryColor,
    fontFace: theme.fontFace,
    align: "center"
  });

  // Content Slides
  data.slides.forEach((slideData) => {
    const slide = pptx.addSlide();
    
    // Background accent
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 0.1, h: "100%",
      fill: { color: theme.primaryColor }
    });

    // Header
    slide.addText(slideData.title, {
      x: 0.5, y: 0.2, w: "90%", h: 0.8,
      fontSize: 32,
      bold: true,
      color: theme.primaryColor,
      fontFace: theme.fontFace,
      margin: 0.1
    });

    // Separator line
    slide.addShape(pptx.ShapeType.line, {
      x: 0.5, y: 1, w: "90%", h: 0,
      line: { color: theme.accentColor, width: 2 }
    });

    const bulletPoints = slideData.content.map(text => ({ text, options: { bullet: true, margin: 5 } }));

    if (slideData.type === 'image_left' || slideData.type === 'image_right') {
      const isLeft = slideData.type === 'image_left';
      const imgX = isLeft ? 0.5 : 5.5;
      const textX = isLeft ? 5.5 : 0.5;
      
      if (slideData.imageKeyword) {
        slide.addImage({
          path: getImageUrl(slideData.imageKeyword),
          x: imgX, y: 1.5, w: 4, h: 3.5,
          rounding: true
        });
      }

      slide.addText(bulletPoints, {
        x: textX, y: 1.5, w: 4, h: 3.5,
        fontSize: 18,
        color: theme.textColor,
        fontFace: theme.fontFace,
        valign: "top"
      });
    } else if (slideData.type === 'comparison') {
      const mid = slideData.content.length / 2;
      const leftPoints = slideData.content.slice(0, mid).map(text => ({ text, options: { bullet: true } }));
      const rightPoints = slideData.content.slice(mid).map(text => ({ text, options: { bullet: true } }));

      slide.addText(leftPoints, {
        x: 0.5, y: 1.5, w: 4.25, h: 3.5,
        fontSize: 18,
        color: theme.textColor,
        fontFace: theme.fontFace,
        valign: "top"
      });

      slide.addText(rightPoints, {
        x: 5.25, y: 1.5, w: 4.25, h: 3.5,
        fontSize: 18,
        color: theme.textColor,
        fontFace: theme.fontFace,
        valign: "top"
      });
    } else if (slideData.type === 'big_stat') {
      slide.addText(slideData.statValue || "0", {
        x: 0.5, y: 1.5, w: "90%", h: 2,
        fontSize: 80,
        bold: true,
        color: theme.accentColor,
        fontFace: theme.fontFace,
        align: "center"
      });
      slide.addText(slideData.statLabel || "", {
        x: 0.5, y: 3.5, w: "90%", h: 1,
        fontSize: 32,
        color: theme.textColor,
        fontFace: theme.fontFace,
        align: "center"
      });
    } else {
      // Standard content
      slide.addText(bulletPoints, {
        x: 0.5, y: 1.2, w: "90%", h: 4,
        fontSize: 20,
        color: theme.textColor,
        fontFace: theme.fontFace,
        valign: "top"
      });
    }

    // Footer
    slide.addText(data.title, {
      x: 0.5, y: 5.2, w: "90%", h: 0.3,
      fontSize: 10,
      color: theme.secondaryColor,
      fontFace: theme.fontFace,
      align: "right"
    });

    if (slideData.notes) {
      slide.addNotes(slideData.notes);
    }
  });

  return pptx.writeFile({ fileName: `${data.title.replace(/[^a-z0-9]/gi, '_')}.pptx` });
}
