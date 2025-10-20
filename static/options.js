document.addEventListener("DOMContentLoaded", () => {
  const seqRadios = document.querySelectorAll("input[name='seqType']");
  const primerSelectors = document.getElementById("primerSelectors");
  const forwardPrimer = document.getElementById("forwardPrimer");
  const reversePrimer = document.getElementById("reversePrimer");

  seqRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      const isPrimerMode = document.getElementById("seqPrimers").checked;
      forwardPrimer.disabled = reversePrimer.disabled = !isPrimerMode;
      primerSelectors.style.opacity = isPrimerMode ? "1" : "0.5";
    });
  });
});
