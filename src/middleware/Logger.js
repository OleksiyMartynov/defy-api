export default (request, response, next) => {
    let log = `=============${new Date()}=============\n`;
    log+=`${request.method} ${request.path}\n`;
    if(request.query){
        log+=`Query:\n${JSON.stringify(request.query)}\n`
    }
    if(request.body){
        log+=`Body:\n${JSON.stringify(request.body)}\n`
    }
    log+="================================================================================"
    console.log(log);
    next();
}