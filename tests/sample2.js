try {
    console.log("Sample2 file executed");
} catch (error) {
    console.error("Error occurred in Sample2:", error);
}



Promise.try(() => {

    console.log("Sample2 Promise executed");
})
