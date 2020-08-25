# AMPScript syntax highlighting, code snippets and more

![AMPScript](https://raw.githubusercontent.com/Bizcuit/vscode-ampscript/master/images/mcfs.gif)

AMPScript is the language used to program emails, content blocks, webpages and script activities in the Salesforce Marketing Cloud. It is not a simple task to write code directly in the UI of MC. This extensions helps you solve this problem.

This extension enables syntax highlighting for AMPScript, allows you to connect Visual Studio Code directly to your MC Account, has built-in documentation for all AMPScript functions and also adds code snippets for language elements and functions. Each snippet includes a detailed description of the function and its parameters. Snippets also show up when you hover a function name.

With direct connection to MC you can: easily change content in MC without leaving your text editor, save time and avoid frequent copy-pasting. It also helps you to better control the content of your emails, content blocks and cloud pages by exposing additional content attributes that are not available in the UI of MC.

### How to enable syntax highlighting

You have two options on how to enable syntax highlighting:

* Open a file that has an ".amp" or an ".ampscript" file extension
* Manually set the language of the file to "AMPscript" (check the video below)

![AMPScript](https://raw.githubusercontent.com/Bizcuit/vscode-ampscript/master/images/screenshot_video_howto.gif)


### How to connect to Marketing Cloud

As of now, you **can only edit existing assets** (content blocks, emails, cloudpage and json message). Functionality that is not supported at the moment: create new asset, rename asset, move asset to a different folder, delete asset.

* In your MC accout, create a new installed package and add a 'Server-to-Server' API integration Component
* Add the following permissions:
	* CHANNELS: Email (Read and Write)
	* CHANNELS: Web (Read, Write, Publish)
	* ASSETS: Saved Content (Read and Write)
* Grant access to all required BUs
* Provide package details in the connection manager below, save it and connect
* You'll find the entire Content Builder library in your File Explorer tab
* To open Connection Manager next time press F1 (or 'CMD+Shift+P' on Mac and 'CTRL+Shift+P' on Windows) and start typing 'MCFS'. Find 'MCFS Connecton Manager' and then hit Enter

Detailed instructions with screenshots are available directly in the Connection Manager. To open Connection Manager press F1 (or 'CMD+Shift+P' on Mac and 'CTRL+Shift+P' on Windows) and start typing 'MCFS'. Find 'MCFS Connecton Manager' and then hit Enter.

### How to edit Content Builder assets directly from Visual Studio Code

Each asset is presented as a folder that starts with an 'Ω' symbol. You can easily distinguish different asset types based on the colored square that goes after 'Ω':
* 🟥 - blocks
* 🟦 - emails
* 🟨 - templates
* 🟩 - cloudpages
* 🟪 - mobile messages

Each asset folder includes a readonly '__raw.readonly.json' file. This is an API representation of the asset. You can not modify. Instead you can modify all other files available under the asset folder. Each file represents a specific part of the asset. For the template based email you will see for example smth like: 
* _htmlcontent.amp - template used to create an email
* _subject.amp - subject line of the email
* _preheader.amp - preheader of the email
* s01.b01.content.amp - content of the first content block (b01) that is located in the first template stack/placeholder (s01)
* s01.b01.super.amp - super content of the block above. Learn more about super content [here](https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/design_super_content.htm)
* s01.b02.content.amp - content of the second block in the first template stack
* s01.b02.super.amp - super content of the second block in the first template stack
* s02.b01.content.amp - content of the first block in the second template stack
* s02.b01.super.amp - super content of the first block in the second template stack


### How it looks and works

#### Demo

![Demo](https://raw.githubusercontent.com/Bizcuit/vscode-ampscript/master/images/screenshot_video.gif)

#### Hover snippets 

![Hover snippets](https://raw.githubusercontent.com/Bizcuit/vscode-ampscript/master/images/screenshot_hoversnippets.jpg)

#### Code snippets 

![Function snippets](https://raw.githubusercontent.com/Bizcuit/vscode-ampscript/master/images/screenshot_snippets.png)

#### Syntax highlighting

![Syntax highlighting](https://raw.githubusercontent.com/Bizcuit/vscode-ampscript/master/images/screenshot.png)



#### Copyright 2017-2020 Sergey Agadzhanov

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
