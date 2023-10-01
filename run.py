#! /usr/bin/env python3
import os
import csv
import time
import json
import logging
import platform
from datetime import datetime

# Import flask for the web UI.
from flask import Flask, render_template, url_for, request

app = Flask(__name__) #root_path='web_app/'

# Configuration:
MAX_ELEMENTS_PER_PAGE = 20 # Maximum elements shown on the screen when searching.

USER_LOGIC = "{0}/db/user_logic.csv".format(os.getcwd())
ALL_LOGIC = "{0}/db/all_logic.csv".format(os.getcwd())


#DB structure:
# Title
# ID
# Tags
# logic
# Description
# Creator


class DB_Manager():

    def __init__(self):
        if not os.path.exists(USER_LOGIC):
            with open(USER_LOGIC, "w") as file:
                file.write("Title,Id,Tags,Logic,Description,Creator\n")

        if not os.path.exists(ALL_LOGIC):
            with open(ALL_LOGIC, "w") as file:
                file.write("Title,Id,Tags,Logic,Description,Creator\n")

        load_user_data = self._load_data(USER_LOGIC)
        self.user_logic = load_user_data
        load_all_data = self._load_data(ALL_LOGIC)
        self.all_logic = load_all_data

    def add_entry(self, entry):
        self.user_logic.append(entry)
        self._save_data(USER_LOGIC, self.user_logic)

    def update_entry(self, new_entry, entry_id):
        updated = False
        for i, entry in enumerate(self.user_logic):
            if entry[1] == entry_id:
                updated = True
                self.user_logic[i] = new_entry
                self._save_data(USER_LOGIC, self.user_logic)

        if not updated:
            self.add_entry(new_entry)
            print("New entry")
        else:
            print("Updated the entry")

    def remove_entry(self, entry_id):
        self.user_logic.append(entry_id)

    def _load_data(self, target_file):
        ## Load the data.
        loaded_rows = []
        with open(target_file, mode='r', newline='') as file:
            csv_reader = csv.reader(file)
            for row in csv_reader:
                loaded_rows.append(row)
        return(loaded_rows)

    def _save_data(self, target_file, data):
        ## Save the data.
        with open(target_file, mode='w', newline='') as file:
            csv_writer = csv.writer(file)

            for row in data:
                csv_writer.writerow(row)

    def search(self, keywords=None):
        all_entries = self.user_logic[1:] + self.all_logic[1:]
        show_entry = []
        found_ids = []

        for entry in all_entries:
            add_entry = False

            if keywords:
                matched_keywords = [keyword for keyword in keywords if keyword in entry[2]]
                if len(matched_keywords) == len(keywords):
                    add_entry = True
            else:
                add_entry = True

            if not entry[1] in found_ids and add_entry:
                found_ids.append(entry[1])
                show_entry.append(entry)

        return(show_entry)


# Create the class to hold the database
database_engine = DB_Manager()

comma_splitter = lambda x : x.lower().replace(" ", "").split(",")


@app.context_processor
def override_url_for():
    return(dict(url_for=dated_url_for))

def dated_url_for(endpoint, **values):
    # Override to prevent cached assets being used.
    if endpoint == 'static':
        filename = values.get('filename', None)
        if filename:
            file_path = os.path.join(app.root_path,
                                    endpoint,
                                    filename)
            values['q'] = int(os.stat(file_path).st_mtime)
    return url_for(endpoint, **values)
    ## Allow for urls to be reloaded and not staticly loaded


@app.route('/', methods=['GET'])
@app.route('/search', methods=['GET'])
def search_page():
    return(render_template('search.html'))


@app.route('/add_logic', methods=['GET'])
def add_logic():
    return(render_template('add_logic.html'))


@app.route('/build_rp', methods=['GET'])
def build_rp():
    return(render_template('build_rp.html'))


@app.route('/rest-api/create', methods=['POST'])
def create_entries():
    data = request.json["data"]
    _id = int(time.time())
    print(data)

    database_engine.add_entry([
        request.form.get("title"),
        _id,
        request.form.get("tags"),
        request.form.get("logic"),
        request.form.get("description"),
        request.form.get("author")
    ])

    return(json.dumps({'call':True, 'data':{'actionResult':"Successfully added {}".format(_id)}}))


@app.route('/rest-api/search', methods=['POST'])
def search_entries():
    # Extract slice and tags from the request.
    data = request.json["data"]

    if data["tags"] != None and data["tags"] != '':
        tags = comma_splitter(data["tags"])
    else:
        tags = []

    print(data)

    link_tags = ["splunk", "new"]
    slice = {
        "next":1,
        "previous":10
    }
    entries = database_engine.search(tags)

    return(json.dumps({'call':True, 'data':{"tags":tags, "slice":slice, "entries":entries}}))


@app.route('/rest-api/generate_rp', methods=['POST'])
def generate_rp():
    data = request.json["data"]
    print(request.json["data"])
    return(json.dumps({'call':True, 'data':{}}))


@app.route('/rest-api/update', methods=['POST'])
def update_entries():
    # Base API for managing trader interaction.
    data = request.json["data"]
    print(request.json["data"])

    uid = data["uid"]
    tags = data["tags"]

    database_engine.update_entry([data["title"],
        uid,
        tags,
        data["logic"],
        "None",
        "None"
    ], uid)

    return(json.dumps({'call':True, 'data':{'actionResult':"Updated {0}".format(uid)}}))


if __name__ == "__main__":
    app.secret_key = os.urandom(12)
    app.run(host="127.0.0.1", port=5000)