charshaf
=

Simple crawling tool to check anchors consistency between different pages across different domains

### Requirements
* Node.js
* Console
* Brain

### Usage

Check the **websites.json** file. The structure is simple:
```
{
  "eq_selector": ".some.divs.classes",
  "websites": [
  {
    "site_name": "site1",
    "host": "http://www.site.com/"
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
* **websites** - List of pages to be checked for consistent anchors.
  * **site_name** - used for caption for generated files.
  * **host** - Valid url of the page.

After you make the needed configurations, go to root dir and execute:
`npm install`

If everything is fine you're ready to run: `node charshaf.js`
