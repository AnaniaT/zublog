const domain = location.origin;
const commentTextarea = document.querySelector("#commentTextarea");
const commentForm = document.querySelector("#commentForm");
const postIdInput = document.querySelector("#postId");
const postId = postIdInput.value;
const commentCount = document.querySelector("#commentCount");
const likeBtn = document.querySelector("#likeBtn");
const likeCount = likeBtn.querySelector(".count");

// KINDA GOOD USER XP WHEN COMMENTING
commentTextarea.addEventListener("input", (e) => {
  e.target.style.height = "1px";
  e.target.style.height = e.target.scrollHeight + "px";
});

// HANDLE COMMENT SUBMISSION
commentForm.addEventListener("submit", async (e) => {
  toggleLoadingBar();
  e.preventDefault();
  const comment = commentTextarea.value;
  commentTextarea.value = "";
  commentTextarea.style.height = "25px";
  await fetch(domain + "/write/comment", {
    method: "POST",
    body: JSON.stringify({
      comment,
      postId,
    }),
    headers: new Headers({ "content-type": "application/json" }),
  })
    .then((r) => {
      if (r.status >= 200 && r.status < 300) {
        screenUpdate(postId);
        return console.log("Good");
      }
      throw new Error("Something went wrong");
    })
    .catch((err) => {
      console.log(err.message);
      alert(err.message);
    });
  toggleLoadingBar(true);
});

// HANDLING LIKE AND UNLIKES
likeBtn.addEventListener("click", async () => {
  const icon = likeBtn.querySelector("svg");
  console.log(icon);
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

// COMMENT KINDA LIVE RELOAD
let isReqPending = false;
const screenUpdate = async (postId) => {
  console.log("updating page...");
  isReqPending = true;
  await fetch(domain + "/get/comments/" + postId, {
    method: "GET",
    headers: new Headers({ "content-type": "application/json" }),
  })
    .then((r) => {
      if (r.status >= 200 && r.status < 300) {
        return r.json();
      }
      throw new Error("Something went wrong");
    })
    .then(({ numOfLikes, numOfComments, view }) => {
      handleDOMUpdate({ numOfLikes, numOfComments, view });
      // renew eventListeners since the DOM is changed
      registerCommentDelListners();
    })
    .catch((e) => alert(e.message));

  isReqPending = false;
};

const handleDOMUpdate = ({ numOfLikes, numOfComments, view }) => {
  const toolBox = document.querySelector("#commentsTab");
  const clearCommentList = () => {
    // WILL ONLY KEEP THE COMMENT FORM IN THE TOOLS
    for (let child of toolBox.children) {
      if (!(child.id === "commentForm")) {
        child.remove();
      }
    }
  };

  let commentsBox = document.querySelector(".comment-container");
  if (commentsBox) {
    if (view) {
      commentsBox.innerHTML = view;
    } else {
      const noCommentsMsg = document.createElement("div");
      noCommentsMsg.classList.add("no-comments");
      noCommentsMsg.textContent = "No Comments yet. Be the first to respond.";
      clearCommentList();
      toolBox.appendChild(noCommentsMsg);
    }
  } else {
    clearCommentList();
    commentsBox = document.createElement("div");
    commentsBox.classList.add("comment-container");
    commentsBox.innerHTML = view;
    toolBox.appendChild(commentsBox);
  }
  commentCount.textContent = numOfComments;
  likeCount.textContent = numOfLikes;
};

// const commentsUpdater = setInterval(() => {
//   if (!isReqPending) {
//     screenUpdate(postId);
//   }
// }, 5000);

window.onunload = window.onbeforeunload = () => {
  clearInterval(commentsUpdater);
};

// HANDLE COMMENT DELETION
const registerCommentDelListners = () => {
  const commentDelBtns = document.querySelectorAll(".comment-del-btn");
  commentDelBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const commentId = btn.dataset.commentid;
      toggleLoadingBar();
      await deleteComment(commentId);
      toggleLoadingBar(true);
    });
  });
};
registerCommentDelListners();

const deleteComment = async (commentId) => {
  await fetch(domain + "/delete/comment", {
    method: "DELETE",
    body: JSON.stringify({ commentId }),
    headers: new Headers({ "content-type": "application/json" }),
  })
    .then((r) => {
      if (r.status >= 200 && r.status < 300) {
        screenUpdate(postId);
        return console.log("Good");
      }
      throw new Error("Something went wrong");
    })
    .catch((err) => {
      console.log(err.message);
      alert(err.message);
    });
};
