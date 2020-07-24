LIST_URL = "https://docs.google.com/document/export?format=html&id=18t_9MHZTENbmYdezAAj4LRM0-Eak_MYO1HssZW2FX1U"
update_list: fetch_list generate_files

fetch_list:
	curl -o list.html $(LIST_URL)

generate_files:
	python parse_list.py

run_server:
	python -m http.server -d public
