/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState } from "react";
import { Button } from "./ui/Button";
import { SelectMaterials } from "./SelectMaterials";

interface Material {
  id: number;
  title: string;
}

type Props = {};

export const MainPage = (props: Props) => {
  const [selectVisible, setSelectVisible] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([]);

  const handleSelectVisible = () => {
    setSelectVisible(!selectVisible);
  };

  const handleSelectedMaterials = (materials: Material[]) => {
    setSelectedMaterials(materials);
    console.log(materials);
  };

  return (
    <div className="flex flex-col space-between h-full w-full">
      {/* <div className="w-full">
        {selectedMaterials.length === 0 && <Button>Moje historie</Button>}
      </div> */}
      <div>
        <h1 className="text-3xl not-italic font-bold mt-20">
          Czego chcesz się nauczyć?
        </h1>
        <p className="text-lg not-italic font-medium leading-6 py-4">
          Wrzuć materiał, z którego mam <br /> stworzyć historię:
        </p>
      </div>

      {selectedMaterials.length > 0 ? (
        <div className="flex flex-col max-h-full flex-grow mt-4">
          <div className="flex justify-between items-center">
            Wybrane materiały ({selectedMaterials.length})
            <div
              className="second-bg py-1 px-3 rounded-full cursor-pointer"
              onClick={handleSelectVisible}
            >
              Dodaj więcej
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full border border-dashed flex flex-col items-center justify-end gap-3 mt-[74px] pt-7 pb-6 px-12 flex-grow second-bg">
          <p className="text-center text-sm not-italic font-semibold leading-4">
            Wrzuć zdjęcia lub tekst, <br /> z których chcesz się uczyć
          </p>
          <Button onClick={handleSelectVisible}>Wrzuć zdjęcia</Button>
        </div>
      )}

      {selectVisible && (
        <SelectMaterials
          onSelectedMaterialsChange={handleSelectedMaterials}
          closeSelectMaterials={() => setSelectVisible(false)}
        />
      )}
      <Button>Załaduj</Button>
    </div>
  );
};
