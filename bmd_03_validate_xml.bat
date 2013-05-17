@echo off
@echo validate_xml.bat %1 %2 %3

rem  supply the file to be validated on the command-line

set BatchDir=%~dp0

:START

set filespec=%1
set dummyfilename=MODS_BMD.xml

rem set JavaExe="C:\Program Files (x86)\Java\jre7\bin\java.exe"
set JavaExe="C:\Program Files\Java\jre7\bin\java.exe"

REM Validation modes: xsv, xerces
set validator=%2
if '%2'=='' set validator=xerces

echo Validating with: %validator%

if '%1'=='' set filespec=%dummyfilename%

cd /d %BatchDir%
if not exist %filespec% goto NoFile

if %validator%==xsv goto XSV
if %validator%==xerces goto XERCES

:XERCES

set XercesPath=%BatchDir%bin\xerces\v2_9_1\

set xerces_CLASSPATH=%XercesPath%xercesImpl.jar
set xerces_CLASSPATH=%xerces_CLASSPATH%;%XercesPath%xercesSamples.jar
set xerces_CLASSPATH=%xerces_CLASSPATH%;%XercesPath%xml-apis.jar 


if '%3'=='' goto NO_ERROR_LOG

echo ===================================================== >> %3
echo %1 >> %3
echo ===================================================== >> %3


%JavaExe% -classpath %xerces_CLASSPATH% sax.Counter -v -s -n %filespec% 2>> %3

goto Done

:NO_ERROR_LOG

%JavaExe% -classpath %xerces_CLASSPATH% sax.Counter -v -s -n %filespec%

goto Done

:XSV

set path=%BinPath%xsv\;%path%

rem xsv.exe -w %filespec%
xsv.exe -o xsv_error_%filespec% %filespec%

echo Error File: %RootDir%db_export\xml\xsv_error_%filespec%

goto Done

:NoFile
echo Missing File: %filespec%

:Done

if '%1'=='' pause


 