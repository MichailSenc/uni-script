#!/usr/bin/env nodejs

const prompts = require("prompts");
const fs = require("fs");
const archiver = require("archiver");
const path = require("path");
const { exec } = require("child_process");
require("datejs");

const fileNames = [
    { path: "../gitblit/data/", folder: "data" },
    { path: "../jenkins/home/", folder: "home" },
    { path: "../kanboard/kanboard_data/", folder: "kanboard_data" },
    { path: "../kanboard/kanboard_plugins/", folder: "kanboard_plugins" },
    { path: "../kanboard/kanboard_ssl/", folder: "kanboard_ssl" },
];

const saves = "./saves";

(async () => {
    const choicetype = await prompts({
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
        const output = fs.createWriteStream(`${__dirname}/saves/${new Date().toString("dd-MM-yyyy-HH-mm-ss")}.zip`);
        const archive = archiver("zip", {
            zlib: { level: 9 }, // Sets the compression level.
        });

        output.on("close", function () {
            console.log(archive.pointer() + " total bytes");
            console.log("Архивирование закончено, выход файла закрыт.");
        });

        output.on("end", function () {
            console.log("Data has been drained");
        });

        archive.on("warning", function (err) {
            if (err.code === "ENOENT") {
                console.log('warning')
            } else {
                throw err;
            }
        });

        archive.on("error", function (err) {
            throw err;
        });

        archive.pipe(output);

        fileNames.forEach(({ path, folder }) => {
            console.log(`Архивирование ${path}...`);
            archive.directory(__dirname + "/" + path, folder);
        });

        archive.finalize();
    };

    const loadTask = async () => {
        const files = fs.readdirSync(saves);

        if (files.length == 0) {
            console.log('Нет доступных сохранений');
            return;
        }

        const choicefolder = await prompts({
            type: "autocomplete",
            name: "value",
            message: "Выберите сохранение",
            choices: files.map((file, i) => {
                console.log(file, i);
                return {
                    title: file,
                    value: file,
                };
            }),
        });

        console.log(choicefolder);
    };

    switch (choicetype.value) {
        case 1:
            createSave();
            break;
        case 2:
            await loadTask();
            break;
        default:
            console.log("Выход...")
            return;
    }
})();
