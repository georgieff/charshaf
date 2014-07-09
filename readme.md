charshaf
=

Simple crawling tool to check anchors consistency between different pages across different domains

### Requirements
* Node.js
* Console
* Brain

### Installation
* Clone.
* Go to the directory with your favorite console.
* Type ``npm install``.

### Usage

Check the **websites.json** file. The structure is simple:
```
{
  "eq_selector": ".some.divs.classes",
  "subscribers": [
    "some-guy@example.com",
    "some-guy2@example.com"
  ],
  "websites": [
  {
    "site_name": "site1",
    "host": "http://www.site.com/",
    "subscribers": [
      "subs1@example.com"
    ]
  },
  {
    "site_name": "site2",
    "host": "http://blogs.site.com/"
  },
  {
    "site_name": "site3",
    "host": "http://support.site.com/"
  }
  ]
}
```
* **eq_selector** - The selector of the container containing anchors. Should be the same for all of the pages. In the example above will select `<element class="some div classes"></element>` content. You can use the same syntax for selection as the one in jQuery.
* **subscribers** - List of subscribers who will receive all of the errors about all of the websites.
* **websites** - List of pages to be checked for consistent anchors.
  * **site_name** - used for caption for generated files.
  * **host** - Valid url of the page.
  * **subscribers** - List of subscribers (under some of the websites) who will receive all of the errors about the specific website.

If everything is fine you're ready to run: `node charshaf.js`

If you want to run charshaf.js repeatedly you can specify scheduled task. Check [https://github.com/mattpat/node-schedule](https://github.com/mattpat/node-schedule). Then: `node scheduler.js`
