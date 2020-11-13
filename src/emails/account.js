const sgMail = require("@sendgrid/mail");
const { verify } = require("jsonwebtoken");

const APIKEY =
  "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";
sgMail.setApiKey(APIKEY);

const genTemp = (cardTitle, cardContent) => {
  const genLogo = (width, heigth, margin) => {
    const logo = `
    <svg
      style="
        width: ${width};
        height: ${heigth};
        margin: ${margin};
        pointer-events: none;
      "
      id="Layer_8"
      data-name="Layer 8"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 34.31 45.19"
    >
      <defs>
        <style>
          .cls-1 {
            fill: none;
          }
          .cls-2 {
            fill: #78c383;
          }
          .cls-3 {
            fill: #3bb26c;
          }
          .cls-4 {
            fill: #39b16c;
          }
        </style>
      </defs>
      <title>Zu+</title>
      <polygon
        class="cls-1"
        points="10.85 36.95 10.8 37.01 19.14 37.01 16.23 33.95 16.23 31.49 16.23 31.39 16.23 31.3 16.23 30.37 10.93 36.86 10.85 36.95"
      />
      <rect class="cls-2" x="21.39" y="31.49" width="6.42" height="5.52" />
      <polygon
        class="cls-3"
        points="30.55 37.01 33.14 34.28 33.14 31.49 33.14 31.39 33.14 31.3 33.14 21.69 31.38 19.61 27.81 19.61 27.81 31.3 27.81 31.39 27.81 31.49 27.81 37.01 30.55 37.01"
      />
      <polygon
        class="cls-4"
        points="23.64 8 23.72 7.91 30.1 0.09 2.76 0.09 2.76 8.26 23.43 8.26 23.57 8.09 23.64 8"
      />
      <polygon
        class="cls-4"
        points="4.09 45.17 4.11 45.17 4.1 45.16 4.09 45.17"
      />
      <polygon
        class="cls-4"
        points="27.81 37.01 21.39 37.01 21.39 31.49 21.39 31.39 21.39 31.3 21.39 24.04 16.23 30.37 16.23 31.3 16.23 31.39 16.23 31.49 16.23 33.95 19.14 37.01 10.8 37.01 10.77 37.04 4.13 45.17 33.77 45.17 33.77 37.01 30.55 37.01 27.81 37.01"
      />
      <polygon
        class="cls-2"
        points="10.8 37.01 10.85 36.95 10.93 36.86 16.23 30.37 21.39 24.04 34.31 8.22 34.25 8.09 34.2 8 34.16 7.91 30.18 0 30.1 0.09 23.72 7.91 23.64 8 23.57 8.09 23.43 8.26 0.07 36.86 0 36.94 0 36.95 0.04 37.04 0.06 37.04 4.1 45.16 4.11 45.17 4.12 45.19 4.13 45.17 10.77 37.04 10.8 37.01"
      />
    </svg>`;

    return logo;
  };
  const temp = `
  <div
      class="wrapper"
      style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #eef;
        padding-top: 30px;
      "
    >
    <div
        style="
          border: 1px solid #77c382;
          width: 380px;
          margin: 0 auto;
          background-color: #fff;
          font-family: 'Source Sans Pro', 'Helvetica Neue', Arial, sans-serif;;
        "
        class="container"
      >
        <div
          style="
            border-bottom: 1px solid rgb(216, 216, 216);
            display: flex;
            justify-content: center;
            height: 30px;
            padding: 5px;
            margin-bottom: 10px;
          "
          class="title"
        >
        ${genLogo("23px", "30px", "0 16px")}
          <div
            style="flex: 1; font-size: 18px; font-weight: 600; line-height: 30px; color:#000;"
            class="txt"
          >
            ${cardTitle}
          </div>
        </div>
        <div class="content" style="width: 300px; margin: 0 auto; color:#000;">
          ${cardContent}
          <div style="margin-top: 10px; color:#000;">
            Feel free to contact me through
            Telegram as
            <a
              target="_blank"
              href="https://t.me/hhanizu"
              style="color: #54f090; text-decoration: none"
              class="link"
              >Hanizu</a
            >.
          </div>
        </div>
  
        <div
          style="
            margin-top: 20px;
            display: flex;
            height: 25px;
            padding: 5px 20px 5px 270px;
          "
          class="footer"
        >
        ${genLogo("auto", "19px", "2.5px 6px")}
          <a
            style="
              font-size: 14px;
              font-weight: 600;
              line-height: 25px;
              text-decoration: none;
              color: rgb(139, 138, 138);
            "
            class="f-txt"
            target="_blank"
            href="https://t.me/hhanizu"
          >
            &copy;ZuBlog
          </a>
        </div>
      </div>
    </div>
    `;
  return temp;
};

const sendVerificationEmail = (email, name, verifyLink) => {
  const title = "ZuBlog Email Verification";
  const content = `
  Hello, ${name}! I really hope it is really you who just signed up on
  ZuBlog if it is really you please click the button below to finish your
  email verification but if it is not you, I really apologize for bothering 
  please ignore this message someone must have entered your email by
  mistake. Thank You!!

  <div style="width: fit-content; margin: 20px auto">
      <a
        type="submit"
        style="
          text-decoration: solid;
          padding: 10px 20px;
          background-color: #77c382;
          border: none;
          outline: none;
          color: #fff;
          border-radius: 3px;
          font-size: 15px;
        "
        target="_blank"
        href="${verifyLink}"
      >
        Verify Email
      </a>
  </div>
    `;
  sgMail
    .send({
      to: email,
      from: {
        name: "Hanizu",
        email: "hanizu.anan@mail.com",
      },
      subject: "ZuBlog Account Verification",
      html: genTemp(title, content),
    })
    .catch((err) => {
      console.log(err);
      setTimeout(() => {
        sendVerificationEmail(email, name, verifyLink);
      }, 3000);
    });
};

const sendWelcomeEmail = (email, name) => {
  const title = "ZuBlog Account Verified";
  const content = `
  How are you doing, ${name}! You have successfuly verified your account
  using this email address. I would like to thank you for joining with me.
  I am sure you will love ZuBlog. Please spare some time in the future to 
  share how you get along with the site. Thank You!!
  `;
  sgMail
    .send({
      to: email,
      from: {
        name: "Hanizu",
        email: "hanizu.anan@mail.com",
      },
      subject: "Welcome to ZuBlog",
      html: genTemp(title, content),
    })
    .catch((err) => {
      console.log(err);
      setTimeout(() => {
        sendWelcomeEmail(email, name);
      }, 3000);
    });
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
};
