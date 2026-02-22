document
  .querySelectorAll<HTMLButtonElement>("button:not(#camera-button)")
  .forEach((button) => {
    button.addEventListener("click", () => {
      button.style.transform = "scale(.95)";
      setTimeout(() => {
        button.style.transform = "scale(1)";
      }, 150);
    });
  });
