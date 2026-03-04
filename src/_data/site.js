module.exports = {
  site_name: "Site name",
  title: "Site title",
  description:
    "Sie description",
  domain: "yoursite.com",
  url: "https://yoursite.com", // It WILL NOT end with a slash /
  lang: "en",
  author: "Name and surname",
  logo: "/assets/img/logo",
  image_width: [320, 480, 720, 1280, 1920, 2048, 2560, 3840, 4096, 7680],
  copyright: {
    year: "0000",
    text: "Copyright text",
    privacy: "",//link to privacy policy
    cookie: "",//link to cookies policy
    cookieControls:
      "",//link to cookies management
    terms: "",//Link to terms and conditions
  },
  homepage: {
    seo: {
      title: "Homepage",
      description: "Description",
      keywords: "First keyword, second keyword",
    },
  },
  anotherpage: {
    seo: {
      title: "Another Page",
      description: "Description",
      keywords: "First keyword, second keyword",
    },
  },
  404: {
    seo: {
      title: "Page title",
    },
  },
};
