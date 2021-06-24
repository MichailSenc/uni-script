#!/usr/bin/env nodejs

const prompts = require("prompts");
const fs = require("fs");
const archiver = require("archiver");
const path = require("path");
const { exec } = require("child_process");
require("datejs");

const fileNames = [
    { path: "gitblit/data", folder: "data" },
    { path: "jenkins/home/", folder: "home" },
    { path: "kanboard/kanboard_data/", folder: "kanboard_data" },
    { path: "kanboard/kanboard_home/", folder: "kanboard_home" },
    { path: "kanboard/kanboard_ssl/", folder: "kanboard_ssl" },
];

(async () => {
    const response = await prompts({
        type: "autocomplete",
        name: "value",
        message: "Выберите дейсвие",
        choices: [
            { title: "Сделать сохранение", value: 1 },
            { title: "Загрузить сохранение", value: 2 },
            { title: "Отмена", value: 0 },
        ],
    });

    const createSave = () => {
        console.log("Сохранение...");
        const output = fs.createWriteStream(__dirname + "/example.zip");
        const archive = archiver("zip", {
            zlib: { level: 9 }, // Sets the compression level.
        });

        output.on("close", function () {
            console.log(archive.pointer() + " total bytes");
            console.log("archiver has been finalized and the output file descriptor has closed.");
        });

        output.on("end", function () {
            console.log("Data has been drained");
        });

        archive.on("warning", function (err) {
            if (err.code === "ENOENT") {
                // log warning
            } else {
                // throw error
                throw err;
            }
        });

        archive.on("error", function (err) {
            throw err;
        });

        archive.pipe(output);

        fileNames.forEach(({ path, folder }) => {
            archive.directory(__dirname + path, `${new Date().toString("dd-MM-yyyy-HH-mm-ss")}`);
        });
    };

    const loadTask = () => {
        console.log(new Date().toString("dd-MM-yyyy-HH-mm-ss"));
        console.log("Загрзка...");
    };

    switch (response.value) {
        case 1:
            createSave();
            break;
        case 2:
            loadTask();
            break;
        default:
            console.log("Дефолт...");
            return;
    }
})();
