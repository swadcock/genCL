@echo fnp_02_sql_script

@echo off

rem if "%RootDir%"=="" set RootDir=D:\work\personal\genealogy\Citations\
if "%RootDir%"=="" set RootDir=C:\Users\Stephen\Documents\FamilyTree\Citations\
if "%SQLScriptDir%"=="" set SQLScriptDir=%RootDir%sql\
if "%BatPath%"=="" set BatPath=%RootDir%procs\
if "%vbScriptDir%"=="" set vbScriptDir=%RootDir%procs\

set dbfile=bmd.mdb

set dbpath=%RootDir%

set dbString="Provider=Microsoft.Ace.OLEDB.12.0; Data Source=%dbpath%%dbfile%; User ID=admin; Password="

echo on

set sqlfile=%SQLScriptDir%bmd_import.sql

call %BatPath%sql_script.bat %dbString% %sqlfile% %vbScriptDir%

echo ==============================================================
echo Next step: manually export table MODS_Export_BMD in XML format

pause


