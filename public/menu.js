const items = document.querySelectorAll(".buttonOption");
let index = 0;

items[index].classList.add("active");

items.forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;

    fetch(`/api/${action}`, {
      method: "POST",
    });
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Enter") {
    e.preventDefault();
  }

  items[index].classList.remove("active");

  if (e.key === "ArrowDown") {
    index = (index + 1) % items.length;
  }

  if (e.key === "ArrowUp") {
    index = (index - 1 + items.length) % items.length;
  }

  if (e.key === "Enter") {
    items[index].click();
  }

  items[index].classList.add("active");
});
