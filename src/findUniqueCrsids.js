/* globals require, process */

var _fs = require( 'fs' );
var _readline = require( 'readline' );

var args = process.argv.splice(2);

var crsids = {};

if( args ){
    if( args.length > 0 ){
        var targetfile = args[0];
        var lineReader = _readline.createInterface({
            input : _fs.createReadStream( targetfile )
        });
        
        lineReader.on( 'line', function( line ){
            var crisPattern = /@@crsid=([0-9]+)@@/;
            var matches = crisPattern.exec( line );
            if( matches.length > 1 ){
                var crsid = matches[1];
                if( typeof crsids[ crsid ] === "undefined" ){
                    crsids[crsid] = 1;
                    console.log( crsid );
                }
            }
        });
    }
}