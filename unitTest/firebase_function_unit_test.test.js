const {
  applyCorsHeaders,
  isPreflightRequest,
  hasValidMealRequest,
  buildRecipePrompt,
  buildOpenAiRequestOptions,
  parseOpenAiRecipeResponse
} = require("../Firebase/functions/recipeGeneration.helpers.js");

describe("firebase function unit tests", () => {
  test("recognizes an OPTIONS preflight request", () => {
    expect(isPreflightRequest("OPTIONS")).toBe(true);
    expect(isPreflightRequest("POST")).toBe(false);
  });

  test("validates when ingredients are missing", () => {
    expect(hasValidMealRequest({ ingredients: "", calories: "500" })).toBe(false);
  });

  test("validates when calories are missing", () => {
    expect(hasValidMealRequest({ ingredients: "chicken, rice", calories: "" })).toBe(false);
  });

  test("applies the expected cors headers", () => {
    const response = { set: jest.fn() };

    applyCorsHeaders(response);

    expect(response.set).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
    expect(response.set).toHaveBeenCalledWith(
      "Access-Control-Allow-Methods",
      "GET,PUT,POST,DELETE,OPTIONS"
    );
  });

  test("builds a prompt with ingredients and calories", () => {
    const prompt = buildRecipePrompt("chicken, rice", "500");

    expect(prompt).toContain("Ingredients available: chicken, rice");
    expect(prompt).toContain("Target calories per meal: 500");
    expect(prompt).toContain("Return ONLY JSON");
  });

  test("builds the correct OpenAI request options", () => {
    const options = buildOpenAiRequestOptions("test-key", "prompt here");
    const parsedBody = JSON.parse(options.body);

    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer test-key");
    expect(parsedBody.model).toBe("gpt-4o-mini");
    expect(parsedBody.messages[0].content).toBe("prompt here");
  });

  test("parses a successful OpenAI response", () => {
    expect(
      parseOpenAiRecipeResponse({
        choices: [
          {
            message: {
              content: '{"recipes":[]}'
            }
          }
        ]
      })
    ).toBe('{"recipes":[]}');
  });

  test("throws when the OpenAI response has no choices", () => {
    expect(() => parseOpenAiRecipeResponse({ choices: [] })).toThrow(
      "Invalid OpenAI response"
    );
  });
});
