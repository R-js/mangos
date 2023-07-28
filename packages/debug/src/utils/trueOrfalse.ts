export default function trueOrFalse(data: string | null | undefined | boolean, defValue: boolean) {
    if (data === null || data === undefined){
        return defValue;
    }
    if (typeof data === 'boolean'){
        return data;
    }
    const low = data.toLowerCase();
    if (low === 'f' || low === 'false'){
        return false;
    }
    if (low === 't' || low === 'true'){
        return true;
    }
    return defValue;
}
