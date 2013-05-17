@echo bmd_02_xsl_Acc2MODS.bat %1

@echo off

rem if "%RootDir%"=="" set RootDir=D:\work\personal\genealogy\Citations\
if "%RootDir%"=="" set RootDir=C:\Users\Stephen\Documents\FamilyTree\Citations\

cd %RootDir%

set infile=.\MODS_Export_BMD.xml

set outfile=.\MODS_BMD.xml
set xslfile=.\xsl\Access2MODS.xsl.xml

.\bin\Saxon\bin\Transform.exe -o:%outfile% %infile% %xslfile%

.\bin\zcrlf.exe -u %outfile% > nul

:DONE

if "%1"=="" pause 
