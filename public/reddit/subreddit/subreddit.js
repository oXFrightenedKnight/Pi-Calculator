const container = document.getElementById("posts");
const nextPageButton = document.querySelectorAll(".nextPageButton")[0];
const noPostMsg = document.querySelectorAll(".noPostMsg")[0];

let posts = []; // DOM element posts
let postData = [];
let index = 0;
let lastIndex = 0;
const currentUrl = window.location.href;

let after = null;
let loading = false;

function getLastUrlArg(url) {
  try {
    const realurl = new URL(url);
    const segments = realurl.pathname.split("/");
    return segments.at(-1);
  } catch (error) {
    console.error(error);
    return null;
  }
}

// fetch posts, return html, recount navigation
async function loadPosts(next = false) {
  if (loading) return;
  loading = true;
  const subreddit = getLastUrlArg(currentUrl);

  const url = new URL(`/api/reddit/${subreddit}`, window.location.origin);
  if (next && after) {
    url.searchParams.set("after", after);
  }

  const res = await fetch(url);
  const data = await res.json();
  postData = data.posts;

  after = data.after;

  container.innerHTML = postData
    .map((post, i) => {
      return `
        <div style="margin-bottom: 0px" class="post" data-index="${i}">
          <h3 class="truncate">${post.title}</h3>
          <small>Score: ${post.score}</small>
        </div>
      `;
    })
    .join("");

  if (postData.length > 0) {
    noPostMsg.classList.add("hidden");
  } else if (postData.length === 0) {
    noPostMsg.classList.remove("hidden");
  }

  initNavigation();
  loading = false;
}

// Clearing functions
function applyActive() {
  clearActive();

  if (index === lastIndex) {
    nextPageButton.classList.add("active");
    nextPageButton.scrollIntoView({ block: "nearest" });
  } else {
    posts[index].classList.add("active");
    posts[index].scrollIntoView({ block: "nearest" });
  }
}
function clearActive() {
  posts.forEach((p) => p.classList.remove("active"));
  nextPageButton.classList.remove("active");
}

// apply active
function initNavigation() {
  posts = document.querySelectorAll(".post");
  if (!posts.length) return;

  index = 0;
  lastIndex = posts.length; // ← кнопка next

  applyActive(); // initial state
}

// Add event listener ONCE
async function handleKey(e) {
  if (["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(e.key)) {
    e.preventDefault();
  }

  if (e.key === "ArrowDown") {
    index = (index + 1) % (posts.length + 1);
  }

  if (e.key === "ArrowUp") {
    index = (index - 1 + (posts.length + 1)) % (posts.length + 1);
  }

  if (e.key === "Escape") {
    window.location.href = "/";
  }

  if (e.key === "Enter") {
    if (index === lastIndex) {
      await loadPosts(true);
      loading = false;
    } else {
      const post = postData[index];
      const postElement = posts[index];

      postElement.innerHTML = `
      <div class="postContainer">
          <h3 class="expandedTitle">${post.title}</h3>
            ${
              post.url || post.selftext
                ? `
            <div class="display_img">
            ${post.url ? `<img src="${post.url}">` : ""}
            ${post.selftext ? `<p class="selftext">${post.selftext}</p>` : ""}
            </div>
            `
                : ""
            }
        <small>Score: ${post.score}</small>
      </div> `;
    }
  }
  applyActive();
}
document.addEventListener("keydown", handleKey);
loadPosts();
