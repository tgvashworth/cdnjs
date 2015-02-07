# cdnjs


# Doc in progress...
# Include GIF


[![build status](https://secure.travis-ci.org/phuu/cdnjs.png)](http://travis-ci.org/phuu/cdnjs)

A search and URL retrieval tool for [cdnjs](//cdnjs.com). It can be used globally on your command line, or as a module.

It's version 3.2.0 powers the [pulldown-api](https://github.com/phuu/pulldown-api).

## Command-line tool

Install `cdnjs` globally:

`npm install -g cdnjs`

### Search

To search cdnjs:

```
$ cdnjs search require

    require-cs            : //cdnjs.cloudflare.com/ajax/libs/require-cs/0.4.2/cs.js
    require-css           : //cdnjs.cloudflare.com/ajax/libs/require-css/0.1.5/css.js
    require-domReady      : //cdnjs.cloudflare.com/ajax/libs/require-domReady/2.0.1/domReady.js
    require-i18n          : //cdnjs.cloudflare.com/ajax/libs/require-i18n/2.0.4/i18n.js
    require-jquery        : //cdnjs.cloudflare.com/ajax/libs/require-jquery/0.25.0/require-jquery.min.js
    require-text          : //cdnjs.cloudflare.com/ajax/libs/require-text/2.0.12/text.js
    require.js            : //cdnjs.cloudflare.com/ajax/libs/require.js/2.1.15/require.min.js
```

### URL

To get a url for a library:

```
$ cdnjs url jquery

    jquery  : //cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min.js
```

The url method also supports versioning:

```
$ cdnjs url jquery@2.1.0

    jquery@2.1.0: //cdnjs.cloudflare.com/ajax/libs/jquery/2.1.0/jquery.min.js
```

### Default

With only one argument passed, `cdnjs` assumes you want to search.

```
$ cdnjs knockout
Unknown method, assuming search.

    knockout*             : //cdnjs.cloudflare.com/ajax/libs/knockout/3.2.0/knockout-min.js
    knockout-bootstrap    : //cdnjs.cloudflare.com/ajax/libs/knockout-bootstrap/0.2.1/knockout-bootstrap.js
    knockout-sortable     : //cdnjs.cloudflare.com/ajax/libs/knockout-sortable/0.8.1/knockout-sortable.min.js
    knockout-validation   : //cdnjs.cloudflare.com/ajax/libs/knockout-validation/2.0.1/knockout.validation.min.js
    knockout.mapping      : //cdnjs.cloudflare.com/ajax/libs/knockout.mapping/2.4.1/knockout.mapping.js
```

## Module

`cdnjs` can also be used as a module. The methods are roughly the same.

### Install

Install via npm:

`npm install cdnjs`

### Methods

#### #libraries ([search], [fields], callback)

Get libraries from cdnjs.com's api (`http://api.cdnjs.com/libraries`). It takes three parameters, two of which are optional:

 - `search` (`String`, optional): a search term that would narrow down the results,
 - `fields` (`Array` of `String`, optional): information about the libraries, returned by the API; values can be:
 
```
version
description
homepage
keywords
maintainers
assets
 ```
 
 - `callback (error, results, total)`: the callback method; `results` is an `Array` of `object` and total is the number of results, returned by the API.

#### #search (libraries, name, callback)

Search for libraries that match `name`in a set of `libraries`. Parameters:

 - `libraries` (`Array` of `object`): the results from a call to `libraries ()`,
 - `name` (`String`): the (partial) name of a library (the search term),
 - `callback (error, results)`: the callback method; `results` is an `object` with the following parameters:
 	- `exact` (`object`): an exact match (if any) between the search term and the `libraries`,
 	- `partials` (`Array` of `object`): patial matches (if any) between the search term and the `libraries`,
 	- `longuestName` (`Integer`): the longest name of a library amongest the search results (used in the cli).


## License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
