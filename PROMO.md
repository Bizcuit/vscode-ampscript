# AMPScript [MCFS) v3: NEW FEATURES

```diff
+ Edit and Run SQL Queries (Special thanks go to Douglas Midgley)
+ Filter and Edit data in Dataextensions
+ Get dataextension metadata
```

```diff
Additional API permissions are required for the new features:
+ AUTOMATION: Automations (Read, Write, Execute)
+ DATA: Data Extensions (Read, Write)
```

### To run an SQL query
* Open "Connection Manager": press F1 or 'CMD+Shift+P' (Mac) or 'CTRL+Shift+P' (Windows) and start typing 'MCFS', find 'MCFS Connecton Manager' and then hit Enter
* Connect to your MC Account, go to File Explorer and open your BU folder
* Open "SQL Queries folder", find your query asset and open a "query.sql" file
* Open the "Command Pallet": press F1 or 'CMD+Shift+P' (Mac) or 'CTRL+Shift+P' (Windows) and start typing 'MCFS'
* Select "MCFS: Run SQL Query" and hit Enter

### To filter a dataextension
* Open "Connection Manager": press F1 or 'CMD+Shift+P' (Mac) or 'CTRL+Shift+P' (Windows) and start typing 'MCFS', find 'MCFS Connecton Manager' and then hit Enter
* Connect to your MC Account, go to File Explorer and open your BU folder
* Open "Dataextensions", find your dataextension asset and open "rows.csv" file
* Open the "Command Pallet": press F1 or 'CMD+Shift+P' (Mac) or 'CTRL+Shift+P' (Windows) and start typing 'MCFS'
* Select "MCFS: Filter a Dataextension" and hit Enter. 
* Set the filter and hit enter
* Filter example: OrderID = 'ORD2123F2' AND SubscriberKey = 'ABC'

# Direct connection to Marketing Cloud

Greetings Marketing Cloud Experts! You've just updated (or installed) an **AMPscript** extension for Visual Studio Code. This version brings some really cool new features, that I would like to share with you. 

```diff
!~ Don't forget to restart Visual Studio Code before using Connection Manager for the first time ~!
```

Share your ideas using [this form](https://docs.google.com/forms/d/e/1FAIpQLSc8NCJcqTxMIIJ5J1pWKTnPY2JewvTS8GU6b9-Lvhdze1N4RA/viewform?usp=sf_link), leave your feedback on the [Extension Page](https://marketplace.visualstudio.com/items?itemName=sergey-agadzhanov.AMPscript) or add a star on my [github repository](https://github.com/Bizcuit/vscode-ampscript).


## 1. Connect directly to your Marketing Cloud Account

With a quick 5 minutes setup you'll be able to edit content blocks, emails, cloudpages, dataextensions and SQL queries without leaving Visual Studio Code. You can now avoid frequent copy-pasting and focus on your work. Have a look a quick demo below. To open Connection Manager: 
* Press F1 (or 'CMD+Shift+P' on Mac and 'CTRL+Shift+P' on Windows) 
* Start typing 'MCFS'
* Find 'MCFS Connecton Manager' and then press Enter
* You'll find detailed setup instuctions there

![AMPScript](https://raw.githubusercontent.com/Bizcuit/vscode-ampscript/master/images/mcfs.gif)

## 1.a How to connect to Marketing Cloud

As of now, you **can only edit existing assets** (content blocks, emails, cloudpage and json message). Functionality that is not supported at the moment: create new asset, rename asset, move asset to a different folder, delete asset.

* In your MC accout, create a new installed package and add a 'Server-to-Server' API integration Component
* Add the following permissions:
	* CHANNELS: Email (Read and Write)
	* CHANNELS: Web (Read, Write, Publish)
	* ASSETS: Saved Content (Read and Write)
	* AUTOMATION: Automations (Read, Write, Execute)
	* DATA: Data Extensions (Read, Write)
* Grant access to all required BUs
* Provide package details in the connection manager below, save it and connect
* You'll find the entire Content Builder library in your File Explorer tab
* To open Connection Manager next time press F1 (or 'CMD+Shift+P' on Mac and 'CTRL+Shift+P' on Windows) and start typing 'MCFS'. Find 'MCFS Connecton Manager' and then hit Enter

Detailed instructions with screenshots are available directly in the Connection Manager. To open Connection Manager press F1 (or 'CMD+Shift+P' on Mac and 'CTRL+Shift+P' on Windows) and start typing 'MCFS'. Find 'MCFS Connecton Manager' and then hit Enter.

### Assets that you can work with
* Content Builder assets (Emails, Messages and Content Blocks)
* Landing Pages (created with Content Builder editor)
* Dataextensions (Edit data in dataextensions, apply filters, export to CSV etc.)
* SQL Queries (Edit queries and Run them)

### 1.b How to edit assets directly from Visual Studio Code

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

## 2. Hover code snippets

Now you can mouse hover a function name in your code and a small popup window including documentation on this function will show up. Check a small example below

![Hover snippets](https://raw.githubusercontent.com/Bizcuit/vscode-ampscript/master/images/screenshot_hoversnippets.jpg)