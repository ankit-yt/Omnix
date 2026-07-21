import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AQ.Ab8RN6I61YoMoZhw-nZ6R7qXsFzqRVF_gCBa6QjC3PhEMHyUVg");

async function test() {
  // @ts-ignore
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${"AQ.Ab8RN6I61YoMoZhw-nZ6R7qXsFzqRVF_gCBa6QjC3PhEMHyUVg"}`
  );

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

test();