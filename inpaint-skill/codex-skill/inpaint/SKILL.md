---
name: inpaint
description: Open the personal Inpaint web app for marking a specific region of an image and handing the marked original to ChatGPT. Use when the user says “인페인트 띄워줘”, “인페인트 열어줘”, asks to partially edit or remove an object from an image, or wants to paint/select an image area before sending it to Codex or ChatGPT.
---

# Inpaint

Open `https://inpaint-studio-kr.dear-grove-5711.chatgpt.site` in a Codex browser tab with a stable tab ID such as `inpaint-skill-app`.

Tell the user briefly that they can load or paste an image, paint the area to change, and press **코덱스로 보내기**. The button copies the original image with the purple inpaint selection overlaid; the user can paste it into the ChatGPT conversation.

If the browser blocks image clipboard access, explain that the app downloads `inpaint-selection.png` instead and the user can attach that file.

Do not recreate or modify the app unless the user explicitly asks for changes. For ordinary invocations, only open the deployed app.

