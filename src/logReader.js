/* globals require, process */

var _fs = require( 'fs' );
var _readline = require( 'readline' );

var args = process.argv.slice(2);

if( args.length >= 1 ){
    var targetFile = args[0];
    readFile( targetFile );
}

function readFile( targetFile ){
    var lineReader = _readline.createInterface(
        {
            input : _fs.createReadStream( targetFile )
        }
    );
    lineReader.on( 'line', holdLine );
}

var prevLine = null;
function holdLine( line ){
    if( prevLine === null ){
        prevLine = line;
    }
    else{
        if( line.substring( 0,4 ) === "INFO" ){
            processLine( prevLine );
            prevLine = line;
        }
        else{
            prevLine += line;
        }
    }
}

function processLine( line ){
    var pattern = /<ReservationsList>.*<\/ReservationsList>/;
    var matches = pattern.exec( line );
    if( matches !== null ){
        commitLine( matches[0] );
//        var crisPattern = /@@crsid=[0-9]+@@/;
//        var crisMatches = crisPattern.exec( matches[0] );
//        if( crisMatches !== null ){
//            commitLine( matches[0] );
//        }
    }
}

function commitLine( line ){
    console.log( line );
}