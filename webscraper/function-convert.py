import json
from pyquery import PyQuery 
import re

def readParams(html, syntax):
	result = {}
	result["description"] = ""
	result["body"] = [syntax]
	
	if not html:
		return result
	
	desc = ""

	pq = PyQuery(html)
	
	for row in pq('tbody tr').items():
		r = PyQuery(row)
		index = r('td:first').text().strip()
		type = r('td:nth-child(2)').text().strip()
		required = r('td:nth-child(3)').text().lower().strip()
		description = r('td:nth-child(4)').text().strip()

		desc = desc + "" + index + (" " if not required else "*") + " [" + type.upper() + "] \n" + description + "\n\n"

		if index.isdigit():
			syntax = re.sub("([\(\,]\s*)" + index + "(\s*[\,\)])", "\\1${" + index + ":" + type.upper() + "}\\2", syntax)
		else:
			print("Check " + syntax + " - " + index)

	result["description"] = desc.strip()
	result["body"] = [syntax]
	return result





result = {}

with open('functions.json') as json_file:
	data = json.load(json_file)
	for line in data:
		params = readParams(line['params'], line['syntax'])

		result[line['link'].lower()] = {
			"prefix": line['link'],
			"body": params['body'],
			"description": (line['link'] if not line['syntax'] else line['syntax']) 
				+ "\n\n" + line['desc'] 
				+ ("" if not params["description"] else "\n\n========== PARAMETERS ============\n\n" + params["description"]) 
				+ ("" if not line["example"] else "\n\n========== EXAMPLES ==============\n\n" + line["example"])
				+ "\n"
		}

with open('function-snippets.json', 'w') as outfile:
    json.dump(result, outfile)