#!/usr/bin/env nodejs

const prompts = require("prompts");
const fs = require("fs");
const Zip = require("machinepack-zip");
const path = require("path");
const AdmZip = require("adm-zip");
const rimraf = require("rimraf");

const ncp = require("ncp").ncp;
const wrench = require("wrench");
const util = require("util");

require("datejs");

const fileNames = [
    { foldpath: path.join(__dirname, "..", "gitblit", "data"), folder: "data" },
    { foldpath: path.join(__dirname, "..", "jenkins", "home"), folder: "home" },
    { foldpath: path.join(__dirname, "..", "kanboard", "kanboard_data"), folder: "kanboard_data" },
    { foldpath: path.join(__dirname, "..", "kanboard", "kanboard_plugins"), folder: "kanboard_plugins" },
    { foldpath: path.join(__dirname, "..", "kanboard", "kanboard_ssl"), folder: "kanboard_ssl" },
];

fileNames.forEach((item) => console.log(item));

const SAVES = "saves";
const UNZIPPED = "unzipped";

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
        Zip.zip({
            sources: fileNames.map(({ foldpath }) => foldpath),
            destination: path.join(__dirname, SAVES, `${new Date().toString("dd-MM-yyyy-HH-mm-ss")}.zip`),
        }).exec({
            error: (err) => {
                console.log("Произошла ошибка при архивировании");
                throw err;
            },
            success: ({ bytesWritten }) => {
                console.log("Success!");
                console.log(`${bytesWritten} total bytes`);
            },
        });
    };

    const loadTask = async () => {
        const files = fs.readdirSync(SAVES);

        if (files.length == 0) {
            console.log("Нет доступных сохранений");
            return;
        }

        const choicefolder = await prompts({
            type: "autocomplete",
            name: "value",
            message: "Выберите сохранение",
            suggest: (input, choices) => {
                return choices.filter((item) => item.title.indexOf(input) !== -1);
            },
            choices: files.map((file, i) => {
                return {
                    title: file,
                    value: file,
                };
            }),
        });

        if (!choicefolder.value) {
            console.log("Вы ничего не выбрали. \nЗавершение работы...");
            return;
        }

        console.log("Распаковка файлов...");
        let zip = new AdmZip(path.join(__dirname, SAVES, choicefolder.value));
        zip.extractAllTo(/*target path*/ path.join(__dirname, UNZIPPED), /*overwrite*/ true);
        console.log("Распаковка выполнена успешно!");

        console.log("Перенос файлов в нужные каталоги...");
        fileNames.forEach(({ foldpath, folder }) => {
            console.log(`Копирование ${folder} в ${path.dirname(foldpath)}...`);
            rimraf.sync(foldpath);
            // ncp(path.join(__dirname, UNZIPPED, folder), path.dirname(foldpath), function (err) {
            //     if (err) {
            //         return console.error(err);
            //     }
            //     console.log("done!");
            // });
            wrench.copyDirSyncRecursive(path.join(__dirname, UNZIPPED, folder), path.dirname(foldpath));
        });

        rimraf.sync(path.join(__dirname, UNZIPPED));
        console.log("Перенос сохранения успешно выполнен!");
    };

    switch (choicetype.value) {
        case 1:
            createSave();
            break;
        case 2:
            await loadTask();
            break;
        default:
            console.log("Выход...");
            return;
    }
})();
