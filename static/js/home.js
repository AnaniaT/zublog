const domain = location.origin;

const blogPosts = document.querySelectorAll(".blog-post");
blogPosts.forEach((post) => {
  const postId = post.dataset.postid;
  const likeBtn = post.querySelector("#likeBtn");
  likeBtn.addEventListener("click", async () => {
    const icon = likeBtn.querySelector("svg");
    icon.style.animation = "likeSpin 1s linear infinite";
    await fetch(domain + "/" + postId + "/likes", {
      method: "POST",
    })
      .then((r) => {
        if (r.status >= 200 && r.status < 300) {
          return r.json();
        }
        throw new Error("Something went wrong");
      })
      .then(({ likes, hasLiked }) => {
        const likeCount = likeBtn.querySelector(".count");
        if (hasLiked) {
          icon.innerHTML = `<path fill="#f51818"
          d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z" />
          `;
        } else {
          icon.innerHTML = `<path fill="#554444"
          d="M458.4 64.3C400.6 15.7 311.3 23 256 79.3 200.7 23 111.4 15.6 53.6 64.3-21.6 127.6-10.6 230.8 43 285.5l175.4 178.7c10 10.2 23.4 15.9 37.6 15.9 14.3 0 27.6-5.6 37.6-15.8L469 285.6c53.5-54.7 64.7-157.9-10.6-221.3zm-23.6 187.5L259.4 430.5c-2.4 2.4-4.4 2.4-6.8 0L77.2 251.8c-36.5-37.2-43.9-107.6 7.3-150.7 38.9-32.7 98.9-27.8 136.5 10.5l35 35.7 35-35.7c37.8-38.5 97.8-43.2 136.5-10.6 51.1 43.1 43.5 113.9 7.3 150.8z" />
          `;
        }
        likeCount.textContent = likes;
      })
      .catch((e) => alert(e.message));
    icon.style.animation = "";
  });
});

const socket = io();
socket.on("numsChanged", ({ type, postId, countNum }) => {
  const blogPost = document.querySelector(`[data-postid='${postId}']`);
  if (blogPost) {
    let selector;
    if (type === "like") {
      selector = "#likeBtn";
    } else if (type === "comment") {
      selector = "#commentBtn";
    }
    const labelBtn = blogPost.querySelector(selector);
    const count = labelBtn.querySelector(".count");
    count.textContent = countNum;
  }
});
