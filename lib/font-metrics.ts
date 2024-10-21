import opentype from "npm:opentype.js@1.3.4";

const characters = Array.from(new Array(11000)).map((_, i) =>
  String.fromCharCode(i)
);

const fontSize = 32;

const calculatorFactory = async (
  fontPath: string,
): Promise<(t: string) => number> => {
  const font = await opentype.load(fontPath);
  return (test: string) => font.getAdvanceWidth(test, fontSize);
};

export async function metricsBuilder(fontFile: string) {
  return {
    "font-size": fontSize,
    widths: characters.map(await calculatorFactory(fontFile)),
  };
}
