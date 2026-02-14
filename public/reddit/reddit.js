window.addEventListener("load", () => {
  document.getElementById("search").focus();
});

const redditInput = document.getElementById("search");

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Enter") {
    e.preventDefault();
  }
  if (e.key === "Enter") {
    window.location.href = `/reddit/${redditInput.value}`;
  }
});
