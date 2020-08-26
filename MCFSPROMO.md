# Direct connection to Marketing Cloud

Greetings Marketing Cloud Experts! You've just updated (or installed) an **AMPscript** extension for Visual Studio Code. This version brings some really cool new features, that I would like to share with you. 

Share your ideas using [this form](https://docs.google.com/forms/d/e/1FAIpQLSc8NCJcqTxMIIJ5J1pWKTnPY2JewvTS8GU6b9-Lvhdze1N4RA/viewform?usp=sf_link), leave your feedback on the [Extension Page](https://marketplace.visualstudio.com/items?itemName=sergey-agadzhanov.AMPscript) or add a star on my [github repository](https://github.com/Bizcuit/vscode-ampscript).


## Connect directly to your Marketing Cloud Account

With a quick 5 minutes setup you'll be able to edit content blocks, emails and cloudpages without leaving Visual Studio Code. You can now avoid frequent copy-pasting and focus on your work. Have a look a quick demo below. To open Connection Manager: 
* Press F1 (or 'CMD+Shift+P' on Mac and 'CTRL+Shift+P' on Windows) 
* Start typing 'MCFS'
* Find 'MCFS Connecton Manager' and then press Enter
* You'll find detailed setup instuctions there

![AMPScript](https://raw.githubusercontent.com/Bizcuit/vscode-ampscript/master/images/mcfs.gif)

## How to connect to Marketing Cloud

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
