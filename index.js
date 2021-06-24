#!/usr/bin/env nodejs

const prompts = require("prompts");
const fs = require("fs");
const Zip = require("machinepack-zip");
const path = require("path");
const { exec } = require("child_process");
const AdmZip = require("adm-zip");
require("datejs");

const fileNames = [
    { path: path.join(__dirname, "..", "gitblit", "data"), folder: "data" },
    { path: path.join(__dirname, "..", "jenkins", "home"), folder: "home" },
    { path: path.join(__dirname, "..", "kanboard", "kanboard_data"), folder: "kanboard_data" },
    { path: path.join(__dirname, "..", "kanboard", "kanboard_plugins"), folder: "kanboard_plugins" },
    { path: path.join(__dirname, "..", "kanboard", "kanboard_ssl"), folder: "kanboard_ssl" },
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
            sources: fileNames.map(({ path }) => path),
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
        }

        let zip = new AdmZip(path.join(__dirname, SAVES, choicefolder.value));
        zip.extractAllTo(/*target path*/ path.join(__dirname, UNZIPPED), /*overwrite*/ true);

        // Zip.unzip({
        //     source: path.join(__dirname, SAVES, choicefolder.value),
        //     destination: path.join(__dirname, UNZIPPED),
        // }).exec({
        //     error: (err) => {
        //         console.log(path.join(__dirname, SAVES, choicefolder.value));
        //         console.log(path.join(__dirname, UNZIPPED));
        //         console.log("Произошла ошибка при распаковке архива");
        //         throw err;
        //     },
        //     success: () => {
        //         console.log("Распаковка выполнена успешно!");
        //         fs.rmdirSync(path.join(__dirname, UNZIPPED));
        //     },
        // });

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
            console.log("Выход...");
            return;
    }
})();
